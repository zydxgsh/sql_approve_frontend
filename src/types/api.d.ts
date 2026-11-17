declare namespace API {
    type BaseRes<T = any> = {
        code: number;
        data: T;
        msg: string;
    };
}
