import React, {useEffect, useState} from 'react';
import {Alert, Button, View} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {DhikrTabKeys, HapticFeedbackMethods} from '../../../common/constants';
import {
  CardView,
  CircleProgressBar,
  RadioButton,
  SubmitButton,
} from '../../../components';
import styles from './style';
import {
  deleteDhikrByDhikrId,
  resetDhikrByItem,
  updateDhikr,
} from '../../../redux/reducers/Dhikr';
import {hapticFeedback} from '../../helpers';
import {ScrollView} from 'react-native-gesture-handler';
import {isNullOrUndefined} from 'typescript-util-functions';

const AllDhikr = () => {
  // Optional configuration
  const options = {
    enableVibrateFallback: true,
    ignoreAndroidSystemSettings: false,
  };
  const dispatch = useDispatch();
  const allDhikrList = useSelector((state: any) =>
    state.dhikr.dhikrs.find((x: {id: number}) => x.id === DhikrTabKeys.All),
  );
  const [value, setValue] = useState('');
  const [radioButtonList, setRadioButtonList] = useState([]);
  useEffect(() => {
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
    }
  }, [allDhikrList]);
  const handleFormSubmit = () => {
    
    // Alert.prompt(
    //   'Form Girişi',
    //   'Lütfen adınızı girin:',
    //   text => {
    //     Alert.prompt(
    //       'Form Girişi',
    //       'Lütfen yaşınızı girin:',
    //       age => {
    //         console.log(`Ad: ${text}, Yaş: ${age}`);
    //       },
    //       'plain-text',
    //       '',
    //       'numeric',
    //     );
    //   },
    //   'plain-text',
    // );
  };
  return (
    <>
      <View
        style={{
          marginTop: 20,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          flex: 1,
        }}>
        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          style={{flex: 0.8}}>
          <RadioButton
            radioButtonList={radioButtonList}
            selectedValue={value}
            onValueChange={value => setValue(value)}
            buttonStyle={{width: 120, height: 30}}
          />
        </ScrollView>
        <View style={{flex: 0.2}}>
          <Button
            title="Sıfırla"
            onPress={() => {
              hapticFeedback(HapticFeedbackMethods.ImpactHeavy);
              handleFormSubmit();
            }}
          />
        </View>
      </View>
      {allDhikrList?.dhikrList?.map(
        (item: {
          dhikrId: number;
          name: string;
          count: number;
          maxCount: number;
        }) => {
          return (
            value === item.dhikrId.toString() && (
              <>
                <CardView
                  key={item.dhikrId + 'card'}
                  cardStyle={styles.containerSingleDhikr}
                  paddingLeft={0}>
                  <CircleProgressBar
                    key={item.dhikrId}
                    progress={(item.count / item.maxCount) * 100}
                    size={150}
                    count={item.count}
                    maxCount={item.maxCount}
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
                <SubmitButton
                  key={item.dhikrId + 'button'}
                  label="Sıfırla"
                  onSubmit={() => {
                    dispatch(resetDhikrByItem({dhikrId: item.dhikrId}));
                    hapticFeedback(HapticFeedbackMethods.ImpactHeavy);
                  }}
                  buttonStyle={{marginHorizontal: 25, marginTop: 20}}
                />
                <SubmitButton
                  key={item.dhikrId + 'button2'}
                  label="Sil"
                  onSubmit={() => {
                    dispatch(
                      deleteDhikrByDhikrId({
                        id: DhikrTabKeys.All,
                        dhikrId: item.dhikrId,
                      }),
                    );
                    hapticFeedback(HapticFeedbackMethods.ImpactHeavy);
                  }}
                  buttonStyle={{marginHorizontal: 25, marginTop: 20}}
                />
              </>
            )
          );
        },
      )}
    </>
  );
};

export default AllDhikr;
