export type Locale = 'zh' | 'en';

export const locales: Locale[] = ['zh', 'en'];

export const messages = {
  zh: {
    title: '艾尔登法环：黑夜君临',
    subtitle: '地图种子识别',
    github: 'Github仓库',
    chooseNightlord: '选择夜王',
    chooseMap: '选择地图类型',
    instructions: '对比游戏地图，在右侧的相应位置标注一些建筑以识别种子',
    instructions_title: '使用说明',
    leftClick: '左键：标记教堂，再次点击取消',
    rightClick: '右键：在法师塔 / 村庄 / 未知之间循环',
    reset: '重置地图',
    matchingSeeds: '匹配种子',
    seedId: '种子ID',
    success: '识别成功！种子ID',
    notFound: '未发现任何种子，已标记',
    buildings: '个建筑地点',
    loading: '生成中...',
    wait: '首次生成地图下载素材较慢请耐心等待..',
    desc1: '艾尔登法环：黑夜君临实际上只有预制的320张地图，8个夜王每个夜王40张，按地形分配为20+5+5+5+5。',
    desc2: '所以你可以在游戏一开始即可通过特定位置的教堂等地标识别种子，并获得地图的以下信息：缩圈位置， 每晚boss的信息， 野外boss的信息，封印监牢的信息， 主城类型（失乡，熔炉，山妖）等。'
  },
  en: {
    title: 'Elden Ring: Night Reign',
    subtitle: 'Seed Map Recognizer',
    github: 'Github Repo',
    chooseNightlord: 'Choose Nightlord',
    chooseMap: 'Choose Shifting Earth',
    instructions: 'Compare with the game map and mark some buildings on the right map to recognize the seed',
    instructions_title: 'Instructions',
    leftClick: 'Left click: mark church, click again to cancel',
    rightClick: 'Right click: cycle between Sorcerer\'s Rise / Township / Unknown',
    reset: 'Reset Map',
    matchingSeeds: 'Matching Seeds',
    seedId: 'Seed ID',
    success: 'Recognized! Seed ID',
    notFound: 'No seed found, marked',
    buildings: 'buildings',
    loading: 'Loading...',
    wait: 'First time generating map may be slow, please wait...',
    desc1: 'Elden Ring: Night Reign actually has only 320 preset maps, 8 nightlords each with 40 maps, distributed by shifting earth as 20+5+5+5+5.',
    desc2: 'So you can recognize the seed at the beginning of the game by marking churches and other landmarks, and get info: circle positions, nightly bosses, field bosses, eternal jail, castle type, etc.'
  }
};

export function t(locale: Locale, key: keyof typeof messages['zh']) {
  return messages[locale][key];
}
