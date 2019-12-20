const getBlockId = (blockId: string) => {
  if (blockId.indexOf('-') === -1) {
    return `${blockId.slice(0, 8)}-${blockId.slice(8, 12)}-${blockId.slice(12, 16)}-${blockId.slice(16, 20)}-${blockId.slice(20)}`;
  }

  return blockId;
};

export default getBlockId;
