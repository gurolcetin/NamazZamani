import {useTranslation} from 'react-i18next';
import {LanguageModel} from '../../common/models';

export const Translate = (languageModel: LanguageModel) => {
  return Geti18nTranslateMethod()(languageModel.key, {
    defaultValue: languageModel.defaultValue,
    options: languageModel.options,
  });
};

export const Geti18nTranslateMethod = () => {
  const {t} = useTranslation();
  return t;
};
