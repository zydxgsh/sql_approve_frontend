import { SSEEvent } from '@/types/usesse';
import { Button } from 'antd';
import { useState } from 'react';
import { useDispatch } from 'umi';

const Test = () => {
  const [txt, setTxt] = useState<string[]>([]);
  const dispatch = useDispatch();
  const test = async () => {
    dispatch({
      type: 'test/testUrl',
      payload: {},
      callback: (res) => {
        console.log('测试接口', res);
      },
    });
  };

  const testAgent = async () => {
    setTxt([]);
    dispatch({
      type: 'agent/startAgent',
      payload: {
        requirement: 'users表中总共有几条数据',
      },
      callback: (res: SSEEvent) => {
        setTxt((prev) => [
          ...prev,
          `[${res?.event} ${JSON.stringify(res?.data)}]`,
        ]);
      },
    });
  };

  return (
    <div>
      <Button onClick={test}>测试接口</Button>
      <Button onClick={testAgent}>测试agent接口</Button>
      <pre style={{ marginTop: 16, background: '#f3f4f6', padding: 12 }}>
        {txt.join('\n')}
      </pre>
    </div>
  );
};

export default Test;
