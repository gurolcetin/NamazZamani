import React, {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  ScrollViewProps,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { updateAppConfig } from '../redux/reducers/ApplicationSettings';
import { isCloseToBottom } from '../core/utils';

type Props = ScrollViewProps & {
  disableReachBottomTracking?: boolean;
};

const ScrollAwareView = forwardRef<ScrollView, Props>((props: Props, ref) => {
  const {
    disableReachBottomTracking = false,
    onScroll,
    onLayout,
    onContentSizeChange,
    scrollEventThrottle,
    ...rest
  } = props;
  const dispatch = useDispatch();
  const [screenHeight, setScreenHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const scrollPositionAtBottomRef = useRef(false);

  useEffect(() => {
    if (disableReachBottomTracking) {
      return;
    }
    if (contentHeight > screenHeight) {
      scrollPositionAtBottomRef.current = false;
      dispatch(updateAppConfig({ isScrollReachToBottom: false }));
    }
  }, [contentHeight, screenHeight, dispatch, disableReachBottomTracking]);

  useEffect(() => {
    if (disableReachBottomTracking) {
      return;
    }
    return () => {
      scrollPositionAtBottomRef.current = false;
      dispatch(updateAppConfig({ isScrollReachToBottom: false }));
    };
  }, [dispatch, disableReachBottomTracking]);

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      setScreenHeight(event.nativeEvent.layout.height);
      onLayout?.(event);
    },
    [onLayout],
  );

  const handleContentSizeChange = useCallback(
    (width: number, height: number) => {
      setContentHeight(height);
      onContentSizeChange?.(width, height);
    },
    [onContentSizeChange],
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!disableReachBottomTracking) {
        const reachedBottom = isCloseToBottom(event.nativeEvent);
        if (scrollPositionAtBottomRef.current !== reachedBottom) {
          scrollPositionAtBottomRef.current = reachedBottom;
          dispatch(updateAppConfig({ isScrollReachToBottom: reachedBottom }));
        }
      }
      onScroll?.(event);
    },
    [disableReachBottomTracking, dispatch, onScroll],
  );

  return (
    <ScrollView
      ref={ref}
      {...rest}
      onLayout={handleLayout}
      onContentSizeChange={handleContentSizeChange}
      onScroll={handleScroll}
      scrollEventThrottle={scrollEventThrottle ?? 16}
    />
  );
});

export default ScrollAwareView;
