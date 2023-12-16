import React from 'react';
import CardView from '../CardView/CardView';
import {View} from 'react-native';
import Divider from '../Divider/Divider';
import {horizontalScale, verticalScale} from '../../core/utils';

interface TableViewProps {
  childrenList: React.ReactNode[];
  dividerMargin?: number;
  paddingVertical?: number;
  marginRight?: number;
  dividerSliceCount?: number;
}

const TableView = (props: TableViewProps) => {
  return (
    <CardView>
      {props.childrenList.map((item, index) => {
        return (
          <View key={index + 'container'}>
            <View
              key={index}
              style={{
                paddingVertical: props.paddingVertical || verticalScale(7.5),
                marginRight: props.marginRight || horizontalScale(20),
              }}>
              {item}
            </View>
            {index <
              props.childrenList.length - (props.dividerSliceCount || 1) && (
              <Divider
                marginLeft={props.dividerMargin ? props.dividerMargin : 0}
                key={index + 'divider'}
              />
            )}
          </View>
        );
      })}
    </CardView>
  );
};

export default TableView;
