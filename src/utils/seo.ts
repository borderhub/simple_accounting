export const defaultMeta = {
    title: 'アートスペース・テトラ | art space tetra',
    description: 'アートスペース・テトラは、福岡市の中心部でありながら枯れた情緒を残す博多区須崎町に2004年4月、オープンいたしました。 企画者や美術家、音楽家、デザイナー等による共同経営',
    url: 'http://www.as-tetra.info/',
    image: 'img/bg.jpeg',
  };
  
  export const buildMeta = (customMeta: Partial<typeof defaultMeta>) => ({
    ...defaultMeta,
    ...customMeta,
  });
  