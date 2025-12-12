import MaskedView from '@react-native-masked-view/masked-view';
import * as React from 'react';
import {
  Animated,
  Easing,
  LayoutRectangle,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../core/providers';

type SkeletonPlaceholderProps = {
  /**
   * Determines component's children.
   */
  children: React.ReactNode;
  /**
   * Determines the color of placeholder.
   * If not provided, theme.skeletonBackgroundColor is used.
   */
  backgroundColor?: string;
  /**
   * Determines the highlight color of placeholder.
   * If not provided, theme.skeletonHighlightColor is used.
   */
  highlightColor?: string;
  /**
   * Determines the animation speed in milliseconds. Use 0 to disable animation.
   */
  speed?: number;
  /**
   * Determines the animation direction, left or right.
   */
  direction?: 'left' | 'right';
  /**
   * Determines if Skeleton should show placeholders or its children.
   */
  enabled?: boolean;
  /**
   * Determines default border radius for placeholders from both
   * SkeletonPlaceholder.Item and generated from children.
   */
  borderRadius?: number;
  /**
   * Determines width of the highlighted area.
   */
  shimmerWidth?: number;
};

type SkeletonPlaceholderItemProps = ViewStyle & {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

const SkeletonPlaceholder: React.FC<SkeletonPlaceholderProps> & {
  Item: React.FC<SkeletonPlaceholderItemProps>;
} = ({
  children,
  enabled = true,
  speed = 800,
  direction = 'right',
  borderRadius,
  shimmerWidth,
  backgroundColor,
  highlightColor,
}) => {
  const [layout, setLayout] = React.useState<LayoutRectangle>();
  const animatedValueRef = React.useRef(new Animated.Value(0));
  const { currentTheme } = useTheme();

  const effectiveBackgroundColor =
    backgroundColor ?? currentTheme.skeletonBackgroundColor;
  const effectiveHighlightColor =
    highlightColor ?? currentTheme.skeletonHighlightColor;

  const isAnimationReady =
    enabled &&
    !!speed &&
    speed > 0 &&
    !!layout?.width &&
    !!layout?.height &&
    !!effectiveHighlightColor;

  React.useEffect(() => {
    if (!isAnimationReady) {
      // Animasyon devre dışı kaldığında değeri sıfırlayabiliriz (isteğe bağlı)
      animatedValueRef.current.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.timing(animatedValueRef.current, {
        toValue: 1,
        duration: speed,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
    );

    loop.start();
    return () => {
      loop.stop();
    };
  }, [isAnimationReady, speed]);

  const animatedGradientStyle = React.useMemo(() => {
    if (!layout?.width) {
      return StyleSheet.absoluteFillObject as ViewStyle;
    }

    const animationWidth = layout.width + (shimmerWidth ?? 0);

    return {
      ...StyleSheet.absoluteFillObject,
      flexDirection: 'row' as const,
      transform: [
        {
          translateX: animatedValueRef.current.interpolate({
            inputRange: [0, 1],
            outputRange:
              direction === 'right'
                ? [-animationWidth, animationWidth]
                : [animationWidth, -animationWidth],
          }),
        },
      ],
    } as ViewStyle;
  }, [direction, shimmerWidth, layout?.width]);

  const placeholders = React.useMemo(() => {
    if (!enabled) {
      return null;
    }

    return (
      <View style={styles.placeholderContainer}>
        {transformToPlaceholder(
          children,
          effectiveBackgroundColor,
          borderRadius,
        )}
      </View>
    );
  }, [children, borderRadius, enabled, effectiveBackgroundColor]);

  const transparentColor = React.useMemo(() => {
    if (!effectiveHighlightColor) return undefined;

    return getTransparentColor(effectiveHighlightColor.replace(/ /g, ''));
  }, [effectiveHighlightColor]);

  if (!enabled || !placeholders) {
    return <>{children}</>;
  }

  if (!layout?.width || !layout.height) {
    return (
      <View
        onLayout={event => {
          setLayout(event.nativeEvent.layout);
        }}
      >
        {placeholders}
      </View>
    );
  }

  return (
    <MaskedView
      style={{ height: layout.height, width: layout.width }}
      maskElement={placeholders}
    >
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: effectiveBackgroundColor },
        ]}
      />

      {isAnimationReady && effectiveHighlightColor && transparentColor && (
        <Animated.View style={animatedGradientStyle}>
          <LinearGradient
            {...getGradientProps(shimmerWidth)}
            colors={[
              transparentColor,
              effectiveHighlightColor,
              transparentColor,
            ]}
          />
        </Animated.View>
      )}
    </MaskedView>
  );
};

SkeletonPlaceholder.Item = (props: SkeletonPlaceholderItemProps) => (
  <View style={getItemStyle(props)}>{props.children}</View>
);
SkeletonPlaceholder.Item.displayName = 'SkeletonPlaceholderItem';

const getGradientProps = (width?: number) => ({
  start: { x: 0, y: 0 },
  end: { x: 1, y: 0 },
  style: { ...StyleSheet.absoluteFillObject, width },
});

const getItemStyle = ({
  children: _,
  style,
  ...styleFromProps
}: SkeletonPlaceholderItemProps) => {
  return style ? [style, styleFromProps] : styleFromProps;
};

const transformToPlaceholder = (
  rootElement: React.ReactNode,
  backgroundColor: string | undefined,
  radius: number | undefined,
): React.ReactNode => {
  if (!rootElement) {
    return null;
  }

  return React.Children.map(
    rootElement,
    (element: React.ReactNode, index: number): React.ReactNode => {
      if (!React.isValidElement(element)) {
        return null;
      }

      const childElement = element as React.ReactElement<any>;
      const props = childElement.props || {};

      if (childElement.type === React.Fragment) {
        return (
          <React.Fragment key={index}>
            {transformToPlaceholder(
              props.children,
              backgroundColor,
              radius,
            )}
          </React.Fragment>
        );
      }

      const isPlaceholder =
        !props.children ||
        typeof props.children === 'string' ||
        typeof props.children === 'number' ||
        (Array.isArray(props.children) &&
          props.children.every(
            (x: any) =>
              x == null || typeof x === 'string' || typeof x === 'number',
          ));

      const rawStyle =
        (element.type as any)?.displayName ===
        SkeletonPlaceholder.Item.displayName
          ? getItemStyle(props)
          : props.style;

      const flatStyle = StyleSheet.flatten(rawStyle) || {};

      const borderRadius =
        props.borderRadius ?? flatStyle.borderRadius ?? radius;
      const width = props.width ?? flatStyle.width;
      const height =
        props.height ??
        flatStyle.height ??
        props.lineHeight ??
        flatStyle.lineHeight ??
        props.fontSize ??
        flatStyle.fontSize;

      const finalStyle = [
        rawStyle,
        isPlaceholder
          ? [styles.placeholder, { backgroundColor }]
          : styles.placeholderContainer,
        {
          height,
          width,
          borderRadius,
        },
      ];

      return (
        <View key={index} style={finalStyle}>
          {!isPlaceholder &&
            transformToPlaceholder(
              props.children,
              backgroundColor,
              borderRadius,
            )}
        </View>
      );
    },
  );
};

const styles = StyleSheet.create({
  placeholderContainer: {
    backgroundColor: 'transparent',
  },
  placeholder: {
    overflow: 'hidden',
  },
});

export default SkeletonPlaceholder;

const getColorType = (color: string) => {
  if (
    new RegExp(
      /^rgba\((0|255|25[0-4]|2[0-4]\d|1\d\d|0?\d?\d),(0|255|25[0-4]|2[0-4]\d|1\d\d|0?\d?\d),(0|255|25[0-4]|2[0-4]\d|1\d\d|0?\d?\d),(0|0?\.\d|1(\.0)?)\)$/,
    ).test(color)
  ) {
    return 'rgba';
  }
  if (
    new RegExp(
      /^rgb\((0|255|25[0-4]|2[0-4]\d|1\d\d|0?\d?\d),(0|255|25[0-4]|2[0-4]\d|1\d\d|0?\d?\d),(0|255|25[0-4]|2[0-4]\d|1\d\d|0?\d?\d)\)$/,
    ).test(color)
  ) {
    return 'rgb';
  }

  if (new RegExp(/^#?([a-f\d]{3,4}|[a-f\d]{6}|[a-f\d]{8})$/i).test(color)) {
    return 'hex';
  }

  throw `The provided color ${color} is not a valid (hex | rgb | rgba) color`;
};

const getTransparentColor = (color: string) => {
  const type = getColorType(color);

  if (type === 'hex') {
    if (color.length < 6) {
      return color.substring(0, 4) + '0';
    }
    return color.substring(0, 7) + '00';
  }
  // @ts-ignore
  const [r, g, b] = color.match(/\d+/g);
  return `rgba(${r},${g},${b},0)`;
};
