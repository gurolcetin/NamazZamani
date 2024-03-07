import React, {useState, useEffect} from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  Dimensions,
  Button,
  Text,
} from 'react-native';

interface CustomModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  buttons: ButtonProps[];
  title?: string;
}

const CustomModal = ({visible, onClose, children, buttons, title}: CustomModalProps) => {
  const [modalHeight, setModalHeight] = useState(
    Dimensions.get('window').height * 0.5,
  );

  useEffect(() => {
    const updateModalHeight = () => {
      setModalHeight(Dimensions.get('window').height * 0.5);
    };

    const subscription = Dimensions.addEventListener(
      'change',
      updateModalHeight,
    );

    return () => {
      subscription?.remove();
    };
  }, []);

  const handleOverlayPress = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={handleOverlayPress}>
        <View style={[styles.modalOverlay, {height: modalHeight}]}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              {title && <Text style={styles.title}>{title}</Text>}
              {children}
              <ButtonRow buttons={buttons} />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
});

export default CustomModal;

interface ButtonRowProps {
  buttons: ButtonProps[];
}

interface ButtonProps {
  title: string;
  onPress: () => void;
  type?: 'cancel' | 'default';
}

const ButtonRow = ({buttons}: ButtonRowProps) => {
  return (
    <View style={buttonStyles.buttonRow}>
      {buttons.map((button, index) => (
        <View key={index}>
          <Button
            title={button.title}
            onPress={button.onPress}
            color={button.type === 'cancel' ? 'red' : 'blue'}
          />
          {index < buttons.length - 1 && (
            <View style={buttonStyles.separator} />
          )}
        </View>
      ))}
    </View>
  );
};

const buttonStyles = StyleSheet.create({
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  separator: {
    width: 1,
    backgroundColor: 'gray',
  },
});
