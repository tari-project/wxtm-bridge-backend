export const convertTokenFrom18ToWxtmDecimals = ({
  tokenAmount,
}: {
  tokenAmount: string;
}): string => {
  const amount = BigInt(tokenAmount);
  const scaleFactor = BigInt(10) ** BigInt(12);
  return (amount / scaleFactor).toString();
};
