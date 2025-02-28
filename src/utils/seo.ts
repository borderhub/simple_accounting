export const defaultMeta = {
    title: '福岡市南区大橋の美容室 Hair Resort un DEUX',
    description: 'un DEUX（アンドゥ）は福岡市南区大橋を拠点にしている美容室。',
    url: 'https://undeux-fukuoka.com/',
    image: 'img/bg.jpeg',
  };
  
  export const buildMeta = (customMeta: Partial<typeof defaultMeta>) => ({
    ...defaultMeta,
    ...customMeta,
  });
  