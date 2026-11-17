import React from 'react';
import { StepState } from '../../config/scenes';
import styles from './index.less';

interface Props {
  steps: StepState[];
}

const STEP_LABELS = [
  { name: '解析需求', desc: '自然语言→结构化描述' },
  { name: '生成 SQL', desc: 'LLM 产出 PostgreSQL' },
  { name: '风险评估', desc: '规则判定红/黄/绿' },
  { name: '人工审批', desc: 'interrupt() 暂停' },
  { name: 'SQL 执行', desc: '批准后在 demo_business 执行' },
];

/**
 * 流水线步骤条
 * 根据步骤状态渲染不同颜色节点与连接线
 */
const PipelineStepper: React.FC<Props> = (props) => {
  const { steps = [] } = props;

  return (
    <div className={styles.stepper}>
      {STEP_LABELS.map((label, i) => {
        const state = steps?.[i] || 'todo';
        const node =
          state === 'done' ? '✓' : state === 'error' ? '!' : String(i + 1);
        return (
          <div key={i} className={`${styles.step} ${styles[state]}`}>
            <div className={styles.node}>{node}</div>
            <div className={styles.sName}>{label.name}</div>
            <div className={styles.sDesc}>{label.desc}</div>
          </div>
        );
      })}
    </div>
  );
};

export default PipelineStepper;
