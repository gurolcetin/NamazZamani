import React, {ReactNode} from 'react';
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
} from 'react-hook-form';
import {Text, View} from 'react-native';
import {ViewStyle} from 'react-native';
import styles from './style';
import FormError from '../FormError/FormError';
import Info from '../Info/Info';
import {scaleFontSize} from '../../core/utils';
import {useTheme} from '../../core/providers';

interface FormControlProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends ControllerProps<TFieldValues, TName> {
  label?: string;
  labelFontSize?: number;
  style?: ViewStyle;
  extra?: ReactNode;
  requiredMessage?: string;
  validateMessage?: string;
  infoText?: string;
}

export const FormControl = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  label,
  labelFontSize,
  style,
  render,
  extra,
  requiredMessage,
  validateMessage,
  infoText,
  ...rest
}: FormControlProps<TFieldValues, TName>) => {
  const {currentTheme} = useTheme();
  return (
    <Controller
      {...rest}
      render={props => {
        return (
          <View style={(styles.container, [style])}>
            <View style={styles.inputContainer}>
              {!!label && (
                <Text
                  style={[
                    styles.label,
                    {
                      fontSize: scaleFontSize(labelFontSize ?? 16),
                      color: currentTheme.textColor,
                    },
                  ]}>
                  {label}
                </Text>
              )}
              <View style={styles.renderContainer}>
                {extra !== undefined ? extra : render(props)}
                {infoText && (
                  <Info
                    infoText={infoText}
                    styleTouchableOpacity={styles.infoIcon}
                  />
                )}
              </View>
            </View>
            <View>
              {!!props.formState.errors[props.field.name] &&
                props.formState.errors[props.field.name]?.type === 'required' &&
                requiredMessage && <FormError message={requiredMessage} />}
              {!!props.formState.errors[props.field.name] &&
                props.formState.errors[props.field.name]?.type === 'validate' &&
                validateMessage && <FormError message={validateMessage} />}
            </View>
            {extra !== undefined ? render(props) : null}
          </View>
        );
      }}
    />
  );
};
