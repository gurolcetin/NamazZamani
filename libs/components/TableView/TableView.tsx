import React from 'react';
import CardView from '../CardView/CardView';
import style from './style';
import {View} from 'react-native';
import Divider from '../Divider/Divider';
import {horizontalScale} from '../../core/utils';

interface TableViewProps {
  childrenList: React.ReactNode[];
}

const TableView = (props: TableViewProps) => {
  return (
    <CardView>
      {props.childrenList.map((item, index) => {
        return (
          <View key={index + 'container'}>
            <View key={index} style={style.container}>
              {item}
            </View>
            {index !== props.childrenList.length - 1 && (
              <Divider marginLeft={50} key={index + 'divider'} />
            )}
          </View>
        );
      })}
    </CardView>
  );
};

export default TableView;
