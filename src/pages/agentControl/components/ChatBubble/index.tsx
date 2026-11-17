import React from 'react';
import styles from './index.less';

interface Props {
  role: 'user' | 'agent';
  title?: string;
  content: string;
  /** 是否显示打字动画（Agent 正在处理） */
  isTyping?: boolean;
}

/**
 * 聊天气泡
 * Agent 侧支持 HTML 内容（通过 dangerouslySetInnerHTML）
 */
const ChatBubble: React.FC<Props> = (props) => {
  const { role = '', title = '', content = '', isTyping = false } = props;
  return (
    <div className={`${styles.bubble} ${styles[role]}`}>
      {title && <div className={styles.who}>{title}</div>}
      {role === 'agent' ? (
        <div dangerouslySetInnerHTML={{ __html: content }} />
      ) : (
        <div>{content}</div>
      )}
      {isTyping && (
        <span className={styles.typing}>
          <i />
          <i />
          <i />
        </span>
      )}
    </div>
  );
};

export default ChatBubble;
