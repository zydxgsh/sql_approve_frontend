// src/layouts/index.tsx
import { Outlet } from '@umijs/max';
import styles from './index.less';

export default function Layout() {
  return (
    <div className={styles.globalWrap}>
      {/* 这里只有Outlet，ProLayout由插件自动在Outlet里面生成，读取app.ts layout */}
      <div className={styles.header}>
        <div className={styles.dot} />
        业务数据变更 Agent 审批控制台
      </div>
      <Outlet />
    </div>
  );
}
