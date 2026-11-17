import { Button } from 'antd';
import React from 'react';
import { SceneConfig } from '../../config/scenes';
import styles from './index.less';

interface Props {
  scene: SceneConfig;
}

/** 执行完成结果面板 */
const ResultPanel: React.FC<Props> = (props) => {
  const { scene } = props;
  const { audit, result, sql } = scene;

  const freshPage = () => {
    window.localStorage.removeItem('thread_id');
    window.location.reload();
  };
  return (
    <div className={styles.wrap}>
      <div className={styles.ok}>✓ SQL 执行完成</div>

      {audit && (
        <div className={styles.auditBar}>
          <span>
            <span className={styles.aK}>审批人</span>
            <span className={styles.aV}>{audit.approver}</span>
          </span>
          <span>
            <span className={styles.aK}>批准时间</span>
            <span className={styles.aV}>{audit.time}</span>
          </span>
          <span>
            <span className={styles.aK}>thread_id</span>
            <span className={styles.aV}>{audit.thread}</span>
          </span>
        </div>
      )}

      {result && (
        <div className={styles.metricGrid}>
          <div className={styles.metric}>
            <div className={styles.mK}>影响行数</div>
            <div className={styles.mV} style={{ color: '#16a34a' }}>
              {result.rows}
            </div>
          </div>
          <div className={styles.metric}>
            <div className={styles.mK}>执行耗时</div>
            <div className={styles.mV}>{result.ms}</div>
          </div>
        </div>
      )}

      {sql && (
        <div>
          <div className={styles.ioLabel}>已执行 SQL</div>
          <div
            className={styles.sqlMini}
            dangerouslySetInnerHTML={{ __html: sql }}
          />
        </div>
      )}

      {result?.note && <div className={styles.note}>{result.note}</div>}

      <Button onClick={freshPage}>发起新需求</Button>
    </div>
  );
};

export default ResultPanel;
