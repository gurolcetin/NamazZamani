import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../core/providers';
import type { RootState } from '../../redux/store';
import {
  completeHintPresentation,
  dismissHintForever,
  registerHint,
  requestHintPresentation,
  selectHintEntryById,
  selectIsHintActive,
  unregisterHint,
} from '../../redux/reducers/ContextualHints';
import { FontScaleOption } from '../../common/enums';
import { getFontScaleMultiplier } from '../../core/helpers';
import { useIsFocused } from '@react-navigation/native';

type ContextualHintProps = {
  hintId: string;
  message: string;
  frequencyMs: number;
  durationMs?: number;
  children: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  overlayOpacity?: number;
  maxBubbleWidth?: number;
  verticalOffset?: number;
  dismissForeverText?: string;
};

type AnchorRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const DEFAULT_DURATION_MS = 9000;
const DEFAULT_HIGHLIGHT_PADDING = 6;
const DEFAULT_HIGHLIGHT_RADIUS = 16;
const BUBBLE_ARROW_SIZE = 14;
const MIN_VISIBLE_RATIO = 0.98;
const STABLE_VISIBLE_FRAMES_REQUIRED = 2;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const isAnchorRectVisible = (
  x: number,
  y: number,
  width: number,
  height: number,
  windowWidth: number,
  windowHeight: number,
  topInset: number,
  bottomInset: number,
) => {
  if (width <= 0 || height <= 0) {
    return false;
  }
  const viewportTop = Math.max(topInset + 6, 0);
  const viewportBottom = Math.max(windowHeight - bottomInset - 6, viewportTop);
  const viewportLeft = 0;
  const viewportRight = windowWidth;

  const right = x + width;
  const bottom = y + height;
  const interLeft = Math.max(x, viewportLeft);
  const interTop = Math.max(y, viewportTop);
  const interRight = Math.min(right, viewportRight);
  const interBottom = Math.min(bottom, viewportBottom);
  const interWidth = Math.max(0, interRight - interLeft);
  const interHeight = Math.max(0, interBottom - interTop);
  const intersectionArea = interWidth * interHeight;
  const targetArea = width * height;
  const visibleRatio = targetArea > 0 ? intersectionArea / targetArea : 0;

  const fullyInside =
    x >= viewportLeft &&
    y >= viewportTop &&
    right <= viewportRight &&
    bottom <= viewportBottom;

  return fullyInside && visibleRatio >= MIN_VISIBLE_RATIO;
};

const ContextualHint: React.FC<ContextualHintProps> = ({
  hintId,
  message,
  frequencyMs,
  durationMs = DEFAULT_DURATION_MS,
  children,
  containerStyle,
  overlayOpacity = 0.55,
  maxBubbleWidth = 340,
  verticalOffset = 10,
  dismissForeverText,
}) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const isFocused = useIsFocused();
  const wrapperRef = useRef<View>(null);
  const stableVisibleFramesRef = useRef(0);
  const [anchorRect, setAnchorRect] = useState<AnchorRect | null>(null);
  const [bubbleHeight, setBubbleHeight] = useState(160);

  const hintEntry = useSelector(selectHintEntryById(hintId));
  const isActive = useSelector(selectIsHintActive(hintId));
  const fontScalePreference = useSelector(
    (state: RootState) =>
      state.applicationSettings?.fontScale ?? FontScaleOption.MEDIUM,
  );
  const fontScaleMultiplier = getFontScaleMultiplier(fontScalePreference);

  const requestPresentation = useCallback(() => {
    if (!isFocused) {
      return;
    }
    dispatch(
      requestHintPresentation({
        hintId,
        frequencyMs,
        now: Date.now(),
      }),
    );
  }, [dispatch, frequencyMs, hintId, isFocused]);

  const measureAnchor = useCallback(() => {
    requestAnimationFrame(() => {
      wrapperRef.current?.measureInWindow((x, y, width, height) => {
        const isVisible = isAnchorRectVisible(
          x,
          y,
          width,
          height,
          window.width,
          window.height,
          insets.top,
          insets.bottom,
        );
        if (!isVisible) {
          stableVisibleFramesRef.current = 0;
          setAnchorRect(null);
          return;
        }

        stableVisibleFramesRef.current += 1;
        if (stableVisibleFramesRef.current < STABLE_VISIBLE_FRAMES_REQUIRED) {
          setAnchorRect(null);
          return;
        }

        setAnchorRect({ x, y, width, height });
      });
    });
  }, [insets.bottom, insets.top, window.height, window.width]);

  useEffect(() => {
    dispatch(registerHint({ hintId }));
    return () => {
      dispatch(unregisterHint({ hintId }));
    };
  }, [dispatch, hintId]);

  useEffect(() => {
    if (!isFocused) {
      return;
    }
    requestPresentation();
  }, [isFocused, requestPresentation]);

  useEffect(() => {
    if (!isFocused || !isActive) {
      stableVisibleFramesRef.current = 0;
      setAnchorRect(null);
      return;
    }

    measureAnchor();
    const interval = setInterval(() => {
      measureAnchor();
    }, 250);

    return () => clearInterval(interval);
  }, [isActive, isFocused, measureAnchor]);

  useEffect(() => {
    if (isFocused || !isActive) {
      return;
    }

    dispatch(
      completeHintPresentation({
        hintId,
        now: Date.now(),
      }),
    );
  }, [dispatch, hintId, isActive, isFocused]);

  useEffect(() => {
    if (
      !isFocused ||
      !hintEntry ||
      isActive ||
      hintEntry.dismissedForever ||
      frequencyMs <= 0
    ) {
      return;
    }

    if (hintEntry.shownCount === 0 || hintEntry.lastShownAt == null) {
      requestPresentation();
      return;
    }

    const elapsed = Date.now() - hintEntry.lastShownAt;
    const waitMs = frequencyMs - elapsed;
    if (waitMs <= 0) {
      requestPresentation();
      return;
    }

    const timeout = setTimeout(() => {
      requestPresentation();
    }, waitMs);

    return () => clearTimeout(timeout);
  }, [frequencyMs, hintEntry, isActive, isFocused, requestPresentation]);

  const handleClose = useCallback(() => {
    dispatch(
      completeHintPresentation({
        hintId,
        now: Date.now(),
      }),
    );
  }, [dispatch, hintId]);

  const handleDismissForever = useCallback(() => {
    dispatch(dismissHintForever({ hintId }));
  }, [dispatch, hintId]);

  const highlightRect = useMemo(() => {
    if (!anchorRect) {
      return null;
    }

    const minX = 8;
    const maxX = window.width - 8;
    const minY = Math.max(insets.top + 4, 4);
    const maxY = window.height - Math.max(insets.bottom + 4, 4);

    const left = clamp(anchorRect.x - DEFAULT_HIGHLIGHT_PADDING, minX, maxX);
    const top = clamp(anchorRect.y - DEFAULT_HIGHLIGHT_PADDING, minY, maxY);
    const right = clamp(
      anchorRect.x + anchorRect.width + DEFAULT_HIGHLIGHT_PADDING,
      minX,
      maxX,
    );
    const bottom = clamp(
      anchorRect.y + anchorRect.height + DEFAULT_HIGHLIGHT_PADDING,
      minY,
      maxY,
    );
    const width = Math.max(0, right - left);
    const height = Math.max(0, bottom - top);

    if (width <= 0 || height <= 0) {
      return null;
    }

    return {
      left,
      top,
      width,
      height,
      radius: DEFAULT_HIGHLIGHT_RADIUS,
      centerX: left + width / 2,
    };
  }, [anchorRect, insets.bottom, insets.top, window.height, window.width]);

  const bubbleLayout = useMemo(() => {
    const screenPadding = 16;
    const minTop = Math.max(insets.top + 8, 12);
    const maxBottomPadding = Math.max(insets.bottom + 8, 12);
    const availableWidth = Math.max(220, window.width - screenPadding * 2);
    const width = Math.min(maxBubbleWidth, availableWidth);

    if (!highlightRect || !anchorRect) {
      return null;
    }

    const targetCenterX = highlightRect
      ? highlightRect.centerX
      : anchorRect.x + anchorRect.width / 2;
    const unclampedLeft = targetCenterX - width / 2;
    const left = Math.max(
      screenPadding,
      Math.min(unclampedLeft, window.width - screenPadding - width),
    );

    const anchorBottom = highlightRect
      ? highlightRect.top + highlightRect.height
      : anchorRect.y + anchorRect.height;
    const anchorTop = highlightRect ? highlightRect.top : anchorRect.y;
    const belowTop = anchorBottom + verticalOffset;
    const aboveTop = anchorTop - bubbleHeight - verticalOffset;
    const canPlaceBelow =
      belowTop + bubbleHeight <= window.height - maxBottomPadding;
    const top = canPlaceBelow ? belowTop : Math.max(minTop, aboveTop);

    return { width, left, top };
  }, [
    anchorRect,
    bubbleHeight,
    highlightRect,
    insets.bottom,
    insets.top,
    maxBubbleWidth,
    verticalOffset,
    window.height,
    window.width,
  ]);

  const bubblePointer = useMemo(() => {
    if (!anchorRect || !bubbleLayout) {
      return null;
    }

    const targetCenterX = highlightRect
      ? highlightRect.centerX
      : anchorRect.x + anchorRect.width / 2;
    const minCenterX = bubbleLayout.left + 22;
    const maxCenterX = bubbleLayout.left + bubbleLayout.width - 22;
    const centerX = clamp(targetCenterX, minCenterX, maxCenterX);
    const bubbleIsBelowTarget =
      bubbleLayout.top >=
      (highlightRect
        ? highlightRect.top + highlightRect.height
        : anchorRect.y + anchorRect.height);

    return {
      left: centerX - BUBBLE_ARROW_SIZE / 2,
      top: bubbleIsBelowTarget
        ? bubbleLayout.top - BUBBLE_ARROW_SIZE / 2
        : bubbleLayout.top + bubbleHeight - BUBBLE_ARROW_SIZE / 2,
      rotate: bubbleIsBelowTarget ? '45deg' : '225deg',
    };
  }, [anchorRect, bubbleHeight, bubbleLayout, highlightRect]);

  const isModalVisible =
    isFocused && isActive && !!highlightRect && !!bubbleLayout;

  useEffect(() => {
    if (!isModalVisible || durationMs <= 0) {
      return;
    }

    const timeout = setTimeout(() => {
      dispatch(
        completeHintPresentation({
          hintId,
          now: Date.now(),
        }),
      );
    }, durationMs);

    return () => clearTimeout(timeout);
  }, [dispatch, durationMs, hintId, isModalVisible]);

  return (
    <View
      ref={wrapperRef}
      collapsable={false}
      onLayout={measureAnchor}
      style={containerStyle}
    >
      {children}

      <Modal
        animationType="fade"
        transparent
        visible={isModalVisible}
        onRequestClose={handleClose}
      >
        <View style={styles.modalRoot}>
          {highlightRect && (
            <>
              <Pressable
                style={[
                  styles.overlayBlock,
                  styles.overlayTopBase,
                  {
                    width: window.width,
                    height: highlightRect.top,
                    backgroundColor: `rgba(0,0,0,${overlayOpacity})`,
                  },
                ]}
                onPress={handleClose}
              />
              <Pressable
                style={[
                  styles.overlayBlock,
                  styles.overlayLeftBase,
                  {
                    top: highlightRect.top,
                    width: highlightRect.left,
                    height: highlightRect.height,
                    backgroundColor: `rgba(0,0,0,${overlayOpacity})`,
                  },
                ]}
                onPress={handleClose}
              />
              <Pressable
                style={[
                  styles.overlayBlock,
                  {
                    left: highlightRect.left + highlightRect.width,
                    top: highlightRect.top,
                    width:
                      window.width - (highlightRect.left + highlightRect.width),
                    height: highlightRect.height,
                    backgroundColor: `rgba(0,0,0,${overlayOpacity})`,
                  },
                ]}
                onPress={handleClose}
              />
              <Pressable
                style={[
                  styles.overlayBlock,
                  styles.overlayBottomBase,
                  {
                    top: highlightRect.top + highlightRect.height,
                    width: window.width,
                    height:
                      window.height - (highlightRect.top + highlightRect.height),
                    backgroundColor: `rgba(0,0,0,${overlayOpacity})`,
                  },
                ]}
                onPress={handleClose}
              />
              <View
                pointerEvents="none"
                style={[
                  styles.highlightFrame,
                  {
                    left: highlightRect.left,
                    top: highlightRect.top,
                    width: highlightRect.width,
                    height: highlightRect.height,
                    borderRadius: highlightRect.radius,
                    borderColor: currentTheme.primary,
                  },
                ]}
              />
            </>
          )}

          {bubblePointer && (
            <View
              pointerEvents="none"
              style={[
                styles.bubbleArrow,
                {
                  left: bubblePointer.left,
                  top: bubblePointer.top,
                  transform: [{ rotate: bubblePointer.rotate }],
                  backgroundColor: currentTheme.cardViewBackgroundColor,
                  borderColor: `${currentTheme.textColor}1F`,
                },
              ]}
            />
          )}
          {bubbleLayout && (
            <View
              style={[
                styles.bubble,
                {
                  width: bubbleLayout.width,
                  left: bubbleLayout.left,
                  top: bubbleLayout.top,
                  backgroundColor: currentTheme.cardViewBackgroundColor,
                  borderColor: `${currentTheme.textColor}1F`,
                },
              ]}
              onLayout={event => {
                const nextHeight = event.nativeEvent.layout.height;
                if (nextHeight > 0 && Math.abs(nextHeight - bubbleHeight) > 1) {
                  setBubbleHeight(nextHeight);
                }
              }}
            >
              <Text
                style={[
                  styles.message,
                  {
                    color: currentTheme.textColor,
                    fontSize: 14 * fontScaleMultiplier,
                    lineHeight: 20 * fontScaleMultiplier,
                  },
                ]}
              >
                {message}
              </Text>
              <View style={styles.actions}>
                <Pressable
                  style={[
                    styles.secondaryButton,
                    { borderColor: `${currentTheme.textColor}26` },
                  ]}
                  onPress={handleDismissForever}
                >
                  <Text
                    style={[
                      styles.secondaryButtonText,
                      {
                        color: currentTheme.textColor,
                        fontSize: 13 * fontScaleMultiplier,
                      },
                    ]}
                  >
                    {dismissForeverText ?? t('contextualHints.dismissForever')}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  overlayBlock: {
    position: 'absolute',
  },
  overlayTopBase: {
    left: 0,
    top: 0,
  },
  overlayLeftBase: {
    left: 0,
  },
  overlayBottomBase: {
    left: 0,
  },
  highlightFrame: {
    position: 'absolute',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
  },
  bubble: {
    position: 'absolute',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
  },
  bubbleArrow: {
    position: 'absolute',
    width: BUBBLE_ARROW_SIZE,
    height: BUBBLE_ARROW_SIZE,
    borderWidth: StyleSheet.hairlineWidth,
    borderTopLeftRadius: 2,
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  secondaryButton: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default ContextualHint;
