import { SagaAction, SagaEffects } from '@/types/saga';
import { serveGet } from "@/utils/request";

export default {
    namespace: 'test',
    state: {},
    effects: {
        *testUrl({ payload, callback }: SagaAction, { call, put }: SagaEffects) {
            const response: API.BaseRes = yield call(serveGet, {
                url: '/api/test',
            });
            if (callback) callback(response);
        }
    }
}