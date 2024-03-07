import React, {useEffect, useState} from 'react';
import {Alert, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {
  DhikrTabKeys,
  GeneralLanguageConstants,
  HapticFeedbackMethods,
  StringConstants,
} from '../../../common/constants';
import {
  CardView,
  CircleProgressBar,
  CustomModal,
  FormControl,
  RadioButton,
  SubmitButton,
} from '../../../components';
import styles from './style';
import {
  addDhikr,
  deleteDhikrByDhikrId,
  resetDhikrByItem,
  updateDhikr,
} from '../../../redux/reducers/Dhikr';
import {Translate, getDhikrProgress, hapticFeedback} from '../../helpers';
import {ScrollView} from 'react-native-gesture-handler';
import {
  isNullOrEmptyString,
  isNullOrUndefined,
  isNumber,
} from 'typescript-util-functions';
import {useTheme} from '../../providers';
import {useForm} from 'react-hook-form';

const AllDhikr = () => {
  const {
    control,
    handleSubmit,
    formState: {errors},
  } = useForm({
    defaultValues: {
      dhikrName: StringConstants.EMPTY_STRING,
      dhikrCount: 33,
    },
  });
  const [visible, setVisible] = useState(false);
  const dispatch = useDispatch();
  const {currentTheme} = useTheme();
  const allDhikrList = useSelector((state: any) =>
    state.dhikr.dhikrs.find((x: {id: number}) => x.id === DhikrTabKeys.All),
  );
  const [value, setValue] = useState('');
  const [radioButtonList, setRadioButtonList] = useState([]);
  const no = Translate(GeneralLanguageConstants.No);
  const yes = Translate(GeneralLanguageConstants.Yes);
  const reset = Translate(GeneralLanguageConstants.Reset);

  const applicationTheme = useSelector((state: any) => state.applicationTheme);
  useEffect(() => {
    console.log(allDhikrList);
    if (
      !isNullOrUndefined(allDhikrList) &&
      !isNullOrUndefined(allDhikrList.dhikrList) &&
      allDhikrList.dhikrList.length > 0
    ) {
      let radioButtonList = allDhikrList.dhikrList.map(
        (item: {
          dhikrId: number;
          name: string;
          count: number;
          maxCount: number;
        }) => {
          return {
            value: item.dhikrId.toString(),
            label: item.name,
          };
        },
      );
      setRadioButtonList(radioButtonList);
      setValue(radioButtonList[0].value);
    } else {
      setRadioButtonList([]);
      setValue('');
    }
  }, [allDhikrList.dhikrList.length]);
  const showAddDhikrModal = () => {
    setVisible(true);
  };
  const onSubmit = data => {
    console.log(data);
    dispatch(
      addDhikr({
        id: DhikrTabKeys.All,
        name: data.dhikrName,
        maxCount: data.dhikrCount,
      }),
    );
    setVisible(false);
  };
  return (
    <>
      {radioButtonList.length > 0 && (
        <View>
          <View
            style={{
              marginTop: 20,
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              flex: 1,
              marginRight: 20,
              marginLeft: 15,
            }}>
            <ScrollView
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              style={{flex: 0.85}}>
              <RadioButton
                radioButtonList={radioButtonList}
                selectedValue={value}
                onValueChange={value => setValue(value)}
                buttonStyle={{width: 120, height: 30}}
              />
            </ScrollView>
            <View style={styles.dhikrAddButtonContainer}>
              <TouchableOpacity
                onPress={() => {
                  hapticFeedback(HapticFeedbackMethods.ImpactHeavy);
                  showAddDhikrModal();
                }}
                style={[
                  styles.dhikrAddButton,
                  {
                    borderColor: currentTheme.primary,
                    backgroundColor: currentTheme.cardViewBackgroundColor,
                  },
                ]}>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: 'bold',
                    color: currentTheme.primary,
                  }}>
                  {StringConstants.PLUS}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          {allDhikrList?.dhikrList?.map(
            (item: {
              dhikrId: number;
              name: string;
              count: number;
              maxCount: number;
              isCyclical: boolean;
            }) => {
              return (
                value === item.dhikrId.toString() && (
                  <View key={item.dhikrId + 'container'}>
                    <CardView
                      key={item.dhikrId + 'card'}
                      cardStyle={styles.containerSingleDhikr}
                      paddingLeft={0}>
                      <CircleProgressBar
                        key={item.dhikrId}
                        progress={getDhikrProgress(item.count, item.maxCount)}
                        size={150}
                        count={item.count}
                        maxCount={item.maxCount}
                        isCyclical={item.isCyclical}
                        incraseValue={() => {
                          dispatch(
                            updateDhikr({
                              id: DhikrTabKeys.All,
                              dhikrId: item.dhikrId,
                            }),
                          );
                        }}
                      />
                    </CardView>
                    <View
                      key={item.dhikrId + 'buttons'}
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginHorizontal: 25,
                        marginTop: 15,
                      }}>
                      <SubmitButton
                        key={item.dhikrId + 'buttonRemove'}
                        label="Sil"
                        onSubmit={() => {
                          Alert.alert(
                            'Zikri silmek istediğinize emin misiniz?',
                            '',
                            [
                              {
                                text: no,
                                onPress: () => {},
                                style: 'cancel',
                              },
                              {
                                text: yes,
                                onPress: () => {
                                  dispatch(
                                    deleteDhikrByDhikrId({
                                      id: DhikrTabKeys.All,
                                      dhikrId: item.dhikrId,
                                    }),
                                  );
                                  hapticFeedback(
                                    HapticFeedbackMethods.ImpactHeavy,
                                  );
                                },
                              },
                            ],
                            {userInterfaceStyle: applicationTheme.theme},
                          );
                        }}
                        buttonStyle={{marginRight: 20}}
                        backgroundColor={currentTheme.systemRed}
                      />
                      <SubmitButton
                        key={item.dhikrId + 'buttonReset'}
                        label={reset}
                        onSubmit={() => {
                          dispatch(resetDhikrByItem({dhikrId: item.dhikrId}));
                          hapticFeedback(HapticFeedbackMethods.ImpactHeavy);
                        }}
                        backgroundColor={currentTheme.systemGreen}
                      />
                    </View>
                  </View>
                )
              );
            },
          )}
        </View>
      )}
      {radioButtonList.length === 0 && (
        <View>
          <SubmitButton
            label="Zikir Eklemek İçin Tıklayın"
            onSubmit={() => {
              showAddDhikrModal();
              hapticFeedback(HapticFeedbackMethods.ImpactHeavy);
            }}
            buttonStyle={{marginHorizontal: 25, marginTop: 30}}
          />
        </View>
      )}
      <CustomModal
        visible={visible}
        title={'Yeni Zikir Kaydı'}
        onClose={() => setVisible(false)}
        buttons={[
          {
            title: 'Kapat',
            onPress: () => setVisible(false),
            type: 'cancel',
          },
          {
            title: 'Kaydet',
            onPress: handleSubmit(onSubmit),
          },
        ]}>
        <>
          <FormControl
            rules={{
              required: true,
            }}
            requiredMessage={Translate(
              GeneralLanguageConstants.RequiredMessage,
            )}
            control={control}
            name="dhikrName"
            render={({field: {onChange, onBlur, value}}) => (
              <>
                <TextInput
                  style={[
                    styles.smallInput,
                    {
                      backgroundColor: currentTheme.inputBackgroundColor,
                      color: currentTheme.textColor,
                      flex: 1,
                    },
                  ]}
                  onBlur={onBlur}
                  onChangeText={val => {
                    onChange(val);
                  }}
                  value={(value ?? StringConstants.EMPTY_STRING).toString()}
                  keyboardType="default"
                  placeholder="Çekilecek zikir adı"
                  placeholderTextColor={currentTheme.gray}
                  autoComplete="off"
                />
              </>
            )}
          />
          <View style={{marginVertical: 5}} />
          <FormControl
            rules={{
              required: true,
              validate: value => {
                if (value && (value > 99999 || value <= 0)) {
                  return false;
                }
                return true;
              },
            }}
            validateMessage="Zikir döngü sayısı 0 ile 99999 arasında olmalıdır."
            requiredMessage={Translate(
              GeneralLanguageConstants.RequiredMessage,
            )}
            control={control}
            name="dhikrCount"
            defaultValue={33}
            render={({field: {onChange, onBlur, value}}) => (
              <>
                <TextInput
                  style={[
                    styles.smallInput,
                    {
                      backgroundColor: currentTheme.inputBackgroundColor,
                      color: currentTheme.textColor,
                      flex: 1,
                    },
                  ]}
                  onBlur={onBlur}
                  onChangeText={val => {
                    if (isNullOrEmptyString(val) || isNumber(val)) {
                      if (Number(val) > 99999) {
                        return onChange(99999);
                      } else {
                        onChange(val);
                      }
                    }
                  }}
                  value={(value ?? StringConstants.EMPTY_STRING).toString()}
                  keyboardType="numeric"
                  placeholder="Zikir döngü sayısı"
                  placeholderTextColor={currentTheme.gray}
                  autoComplete="off"
                />
              </>
            )}
          />
        </>
      </CustomModal>
    </>
  );
};

export default AllDhikr;
