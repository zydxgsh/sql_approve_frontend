import React, { useEffect, useState } from 'react';
import { StepCard } from '../../config/scenes';
import styles from './index.less';

interface Props {
  cards: StepCard[];
}

/**
 * 步骤详情折叠卡列表
 * 默认展开 running / paused / error 状态的卡片
 */
const StepDetailCards: React.FC<Props> = (props) => {
  const { cards = [] } = props;
  const [openSet, setOpenSet] = useState<Set<number>>(new Set());

  // 卡片数据变化时，重置展开集合（默认展开运行中/暂停/错误卡）
  useEffect(() => {
    const set = new Set<number>();
    cards.forEach((c, i) => {
      if (['running', 'paused', 'error'].includes(c.st)) set.add(i);
    });
    setOpenSet(set);
  }, [cards]);

  //   手动展开
  const toggle = (idx: number) => {
    setOpenSet((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  /** 内容是否为 HTML（用于区分 pre 与 plain 渲染） */
  const isHtml = (str: string) => str.trim().startsWith('<');

  return (
    <div className={styles.stepCards}>
      {cards.map((card, idx) => {
        const isOpen = openSet.has(idx);
        const badge =
          card.st === 'done' ? '✓' : card.st === 'error' ? '!' : idx + 1;
        return (
          <div
            key={idx}
            className={`${styles.stepCard} ${isOpen ? styles.open : ''}`}
          >
            <div className={styles.head} onClick={() => toggle(idx)}>
              <span className={`${styles.badge} ${styles[card.st]}`}>
                {badge}
              </span>
              <span className={styles.title}>{card.t}</span>
              <span className={`${styles.state} ${styles[card.st]}`}>
                {card.stText}
              </span>
              <span className={styles.arrow}>▶</span>
            </div>
            {isOpen && (
              <div className={styles.body}>
                {card.io.map(([label, value], i) => (
                  <div key={i} className={styles.ioBlock}>
                    <div className={styles.ioLabel}>{label}</div>
                    {isHtml(value) ? (
                      <pre dangerouslySetInnerHTML={{ __html: value }} />
                    ) : (
                      <div className={styles.plain}>{value}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StepDetailCards;
