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

interface FormControlProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends ControllerProps<TFieldValues, TName> {
  label?: string;
  labelFontSize?: number;
  style?: ViewStyle;
  extra?: ReactNode;
  requiredMessage?: string;
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
  infoText,
  ...rest
}: FormControlProps<TFieldValues, TName>) => {
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
                    {fontSize: scaleFontSize(labelFontSize || 16)},
                  ]}>
                  {label}
                </Text>
              )}
              <View
                style={{
                  flexDirection: 'row',
                  flex: 0.7,
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                }}>
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
                requiredMessage && (
                  <FormError requiredMessage={requiredMessage} />
                )}
            </View>
            {extra !== undefined ? render(props) : null}
          </View>
        );
      }}
    />
  );
};
