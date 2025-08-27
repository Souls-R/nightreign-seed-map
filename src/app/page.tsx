'use client';

import { useState, useEffect, useRef } from 'react';

interface MapData {
  maps: Record<string, any>;
  constructs: Record<string, any[]>;
  coordinates: Record<string, [number, number]>;
  names: Record<string, string>;
}

export default function Home() {
  const [mapId, setMapId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mapData, setMapData] = useState<MapData | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/maps.json');
        const data: MapData = await response.json();
        setMapData(data);
        console.log('数据加载完成');
      } catch (error) {
        console.error('加载数据失败:', error);
        setError('加载数据失败');
      }
    };
    loadData();
  }, []);

  // 加载图片
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  // 生成地图
  const generateMap = async () => {
    if (!mapId.trim()) {
      setError('请输入地图ID');
      return;
    }

    if (!mapData || !mapData.maps[mapId]) {
      setError('地图ID不存在');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const mapInfo = mapData.maps[mapId];
      const backgroundName = `background_${mapInfo.Special}.png`;

      // 加载背景图片
      const backgroundImg = await loadImage(`/static/${backgroundName}`);

      // 设置canvas大小
      canvas.width = backgroundImg.width;
      canvas.height = backgroundImg.height;

      // 绘制背景
      ctx.drawImage(backgroundImg, 0, 0);

      // 绘制NightLord
      if (mapInfo.NightLord !== undefined && mapInfo.NightLord !== null) {
        try {
          const nightlordImg = await loadImage(`/static/nightlord_${mapInfo.NightLord}.png`);

          // 保存当前合成模式
          const previousCompositeOperation = ctx.globalCompositeOperation;
          // 使用lighter模式以实现夜光效果
          ctx.globalCompositeOperation = 'lighter';
          ctx.drawImage(nightlordImg, 0, 0);
          // 恢复之前的合成模式
          ctx.globalCompositeOperation = previousCompositeOperation;
        } catch (error) {
          console.warn(`无法加载NightLord图片`);
        }
      }

      // 绘制Treasure
      const treasureValue = mapInfo.Treasure_800;
      const combinedValue = treasureValue * 10 + mapInfo.Special;
      try {
        const treasureImg = await loadImage(`/static/treasure_${combinedValue}.png`);
        // 保存当前合成模式
        const previousCompositeOperation = ctx.globalCompositeOperation;
        // 设置为source-over以正确处理透明度
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(treasureImg, 0, 0);
        // 恢复之前的合成模式
        ctx.globalCompositeOperation = previousCompositeOperation;
      } catch (error) {
        console.warn(`无法加载Treasure图片`);
      }

      // 绘制RotRew
      if (mapInfo.RotRew_500 !== 0) {
        try {
          const rotrewImg = await loadImage(`/static/RotRew_${mapInfo.RotRew_500}.png`);
          // 保存当前合成模式
          const previousCompositeOperation = ctx.globalCompositeOperation;
          // 设置为source-over以正确处理透明度
          ctx.globalCompositeOperation = 'source-over';
          ctx.drawImage(rotrewImg, 0, 0);
          // 恢复之前的合成模式
          ctx.globalCompositeOperation = previousCompositeOperation;
        } catch (error) {
          console.warn(`无法加载RotRew图片`);
        }
      }

      // 绘制Start
      try {
        const startImg = await loadImage(`/static/Start_${mapInfo.Start_190}.png`);
        // 保存当前合成模式
        const previousCompositeOperation = ctx.globalCompositeOperation;
        // 设置为source-over以正确处理透明度
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(startImg, 0, 0);
        // 恢复之前的合成模式
        ctx.globalCompositeOperation = previousCompositeOperation;
      } catch (error) {
        console.warn(`无法加载Start图片`);
      }

      // 绘制建筑
      if (mapData.constructs && mapData.constructs[mapId]) {
        for (const construct of mapData.constructs[mapId]) {
          try {
            const constructImg = await loadImage(`/static/Construct_${construct.type}.png`);
            const coord = mapData.coordinates[construct.coord_index.toString()];
            if (coord) {
              const [x, y] = coord;
              const drawX = x - constructImg.width / 2;
              const drawY = y - constructImg.height / 2;
              ctx.drawImage(constructImg, drawX, drawY);
            }
          } catch (error) {
            console.warn(`无法加载建筑图片 Construct_${construct.type}.png`);
          }
        }
      }

      // 绘制Night Circle图片和文字标注
      const day1Loc = mapInfo.Day1Loc.toString();
      const day2Loc = mapInfo.Day2Loc.toString();

      if (mapData.coordinates && mapData.coordinates[day1Loc]) {
        try {
          const nightCircleImg = await loadImage('/static/night_circle.png');
          const [x, y] = mapData.coordinates[day1Loc];
          const drawX = x - nightCircleImg.width / 2;
          const drawY = y - nightCircleImg.height / 2;
          ctx.drawImage(nightCircleImg, drawX, drawY);
        } catch (error) {
          console.warn('无法加载night_circle图片');
        }
      }

      if (mapData.coordinates && mapData.coordinates[day2Loc]) {
        try {
          const nightCircleImg = await loadImage('/static/night_circle.png');
          const [x, y] = mapData.coordinates[day2Loc];
          const drawX = x - nightCircleImg.width / 2;
          const drawY = y - nightCircleImg.height / 2;
          ctx.drawImage(nightCircleImg, drawX, drawY);
        } catch (error) {
          console.warn('无法加载night_circle图片');
        }
      }

      // 绘制Night Circle文字标注
      if (mapData.coordinates && mapData.coordinates[day1Loc]) {
        const [x, y] = mapData.coordinates[day1Loc];
        // Day1 Boss文字
        if (mapData.names && mapData.names[mapInfo.Day1Boss.toString()]) {
          const text = "DAY1 " + mapData.names[mapInfo.Day1Boss.toString()];
          ctx.fillStyle = '#781EF0'; // 紫色文字
          ctx.font = '95px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // 添加文字阴影
          ctx.fillStyle = 'white';
          ctx.fillText(text, x-3, y-3);
          ctx.fillText(text, x-1, y-1);
          ctx.fillStyle = 'black';
          ctx.fillText(text, x+1, y+1);
          ctx.fillText(text, x+3, y+3);
          ctx.fillText(text, x+5, y+5);
          ctx.fillText(text, x+7, y+7);

          // 主文字
          ctx.fillStyle = '#781EF0';
          ctx.fillText(text, x, y);
        }

        // Day1 额外文字
        if (mapInfo.extra1 !== -1 && mapData.names && mapData.names[mapInfo.extra1.toString()]) {
          const extraText = mapData.names[mapInfo.extra1.toString()];
          ctx.fillStyle = '#781EF0';
          ctx.font = '95px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // 添加文字阴影
          ctx.fillStyle = 'white';
          ctx.fillText(extraText, x-3, y+100);
          ctx.fillText(extraText, x-1, y+100);
          ctx.fillStyle = 'black';
          ctx.fillText(extraText, x+1, y+100);
          ctx.fillText(extraText, x+3, y+100);
          ctx.fillText(extraText, x+5, y+100);
          ctx.fillText(extraText, x+7, y+100);

          // 主文字
          ctx.fillStyle = '#781EF0';
          ctx.fillText(extraText, x, y+100);
        }
      }

      if (mapData.coordinates && mapData.coordinates[day2Loc]) {
        const [x, y] = mapData.coordinates[day2Loc];
        // Day2 Boss文字
        if (mapData.names && mapData.names[mapInfo.Day2Boss.toString()]) {
          const text = "DAY2 " + mapData.names[mapInfo.Day2Boss.toString()];
          ctx.fillStyle = '#781EF0';
          ctx.font = '95px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // 添加文字阴影
          ctx.fillStyle = 'white';
          ctx.fillText(text, x-3, y-3);
          ctx.fillText(text, x-1, y-1);
          ctx.fillStyle = 'black';
          ctx.fillText(text, x+1, y+1);
          ctx.fillText(text, x+3, y+3);
          ctx.fillText(text, x+5, y+5);
          ctx.fillText(text, x+7, y+7);

          // 主文字
          ctx.fillStyle = '#781EF0';
          ctx.fillText(text, x, y);
        }

        // Day2 额外文字
        if (mapInfo.extra2 !== -1 && mapData.names && mapData.names[mapInfo.extra2.toString()]) {
          const extraText = mapData.names[mapInfo.extra2.toString()];
          ctx.fillStyle = '#781EF0';
          ctx.font = '95px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // 添加文字阴影
          ctx.fillStyle = 'white';
          ctx.fillText(extraText, x-3, y+100);
          ctx.fillText(extraText, x-1, y+100);
          ctx.fillStyle = 'black';
          ctx.fillText(extraText, x+1, y+100);
          ctx.fillText(extraText, x+3, y+100);
          ctx.fillText(extraText, x+5, y+100);
          ctx.fillText(extraText, x+7, y+100);

          // 主文字
          ctx.fillStyle = '#781EF0';
          ctx.fillText(extraText, x, y+100);
        }
      }

      // 绘制建筑文字标注
      if (mapData.constructs && mapData.constructs[mapId]) {
        for (const construct of mapData.constructs[mapId]) {
          if (mapData.coordinates && mapData.coordinates[construct.coord_index.toString()] && mapData.names && mapData.names[construct.type.toString()]) {
            const [x, y] = mapData.coordinates[construct.coord_index.toString()];
            const text = mapData.names[construct.type.toString()];

            ctx.fillStyle = '#FFFF00'; // 黄色文字
            ctx.font = '65px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // 添加文字阴影
            ctx.fillStyle = 'black';
            ctx.fillText(text, x+4, y+4);
            ctx.fillText(text, x-4, y-4);

            // 主文字
            ctx.fillStyle = '#FFFF00';
            ctx.fillText(text, x, y);
          }
        }
      }

      // 绘制事件描述文字
      let eventText = '';
      if (mapInfo.EventFlag === 7705 || mapInfo.EventFlag === 7725) {
        const eventFlagName = (mapData.names && mapData.names[mapInfo.EventFlag.toString()]) || mapInfo.EventFlag.toString();
        const eventValueName = (mapData.names && mapData.names[mapInfo['Event_30*0'].toString()]) || mapInfo['Event_30*0'].toString();
        eventText = `特殊事件：${eventFlagName} ${eventValueName}`;
      } else {
        const eventFlagName = (mapData.names && mapData.names[mapInfo.EventFlag.toString()]) || mapInfo.EventFlag.toString();
        eventText = `特殊事件：${eventFlagName}`;
      }

      if (eventText) {
        const eventX = 1200;
        const eventY = 4300;

        ctx.fillStyle = '#FFFFFF'; // 白色文字
        ctx.font = '160px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        // 添加文字阴影
        ctx.fillStyle = '#730FE6'; // 紫色阴影
        ctx.fillText(eventText, eventX+15, eventY+15);

        // 主文字
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(eventText, eventX, eventY);
      }

      // 缩放canvas到1/5大小显示
      const scale = 0.2;
      const scaledWidth = canvas.width * scale;
      const scaledHeight = canvas.height * scale;
      canvas.style.width = scaledWidth + 'px';
      canvas.style.height = scaledHeight + 'px';

    } catch (error) {
      console.error('生成地图失败:', error);
      setError('生成地图失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1>地图生成器</h1>
        <div style={{
          marginBottom: '20px',
          display: 'flex',
          gap: '10px',
          alignItems: 'center'
        }}>
          <label htmlFor="mapId">地图ID:</label>
          <input
            type="text"
            id="mapId"
            placeholder="输入地图ID"
            value={mapId}
            onChange={(e) => setMapId(e.target.value)}
            style={{
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px',
              width: '200px'
            }}
          />
          <button
            onClick={generateMap}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            生成地图
          </button>
        </div>
        {loading && <div style={{ color: '#666', fontStyle: 'italic' }}>正在生成地图...</div>}
        {error && <div style={{ color: '#dc3545', marginTop: '10px' }}>{error}</div>}
        <canvas
          ref={canvasRef}
          style={{
            border: '1px solid #ddd',
            marginTop: '20px',
            maxWidth: '100%',
            height: 'auto'
          }}
        />
      </div>
    </div>
  );
}
