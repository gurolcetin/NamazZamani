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

interface FormControlProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends ControllerProps<TFieldValues, TName> {
  label?: string;
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
              {!!label && <Text style={styles.label}>{label}</Text>}
              {render(props)}
              {extra}
              {infoText && (
                <Info
                  infoText={infoText}
                  styleTouchableOpacity={styles.infoIcon}
                />
              )}
            </View>
            <View>
              {!!props.formState.errors[props.field.name] &&
                requiredMessage && (
                  <FormError requiredMessage={requiredMessage} />
                )}
            </View>
          </View>
        );
      }}
    />
  );
};
