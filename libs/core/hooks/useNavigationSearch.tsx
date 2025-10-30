import { useNavigation } from '@react-navigation/native';
import { useLayoutEffect, useState } from 'react';
import { SearchBarProps } from 'react-native-screens';

export const useNavigationSearch = ({
  searchBarOptions,
  onFocus,
  onBlur,
  onCancel,
}: {
  searchBarOptions?: SearchBarProps;
  onFocus?: () => void;
  onBlur?: () => void;
  onCancel?: () => void;
}) => {
  const [search, setSearch] = useState('');

  const navigation = useNavigation();

  const handleOnChangeText: SearchBarProps['onChangeText'] = ({
    nativeEvent: { text },
  }) => {
    setSearch(text);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerSearchBarOptions: {
        ...searchBarOptions,
        hideWhenScrolling: true,
        onChangeText: handleOnChangeText,
        onFocus: onFocus,
        onBlur: onBlur,
        onCancelButtonPress: (e: any) => {
          onCancel?.();
          searchBarOptions?.onCancelButtonPress?.(e);
        },
      },
    });
  }, [navigation, searchBarOptions, onFocus, onBlur, onCancel]);

  return search;
};
