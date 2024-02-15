import React from 'react';
import CardView, {CardViewProps} from '../CardView/CardView';

interface MultipleCardViewProps {
  childrenList: CardViewProps[];
}

const MultipleCardView = (props: MultipleCardViewProps) => {
  return (
    <>
      {props.childrenList.map((item, index) => {
        return <CardView key={index} {...item} />;
      })}
    </>
  );
};

export default MultipleCardView;
