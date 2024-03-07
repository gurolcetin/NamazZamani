export const getDhikrProgress = (dhikrCount: number, dhikrMaxCount: number) => {
  if (dhikrCount === 0) {
    return 0;
  } else if (dhikrCount % dhikrMaxCount === 0) {
    return 100;
  } else {
    return ((dhikrCount % dhikrMaxCount) / dhikrMaxCount) * 100;
  }
};
