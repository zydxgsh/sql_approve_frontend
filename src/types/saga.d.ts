
/** effect第二个参数，saga注入的工具对象 */
export type SagaEffects = {
    call: typeof call;
    put: typeof put;
    select: typeof select;
};

/** 通用Action类型，带payload、自定义callback */
export interface SagaAction<P = any> {
    type: string;
    payload: P;
    callback?: (res?: any) => void;
}
