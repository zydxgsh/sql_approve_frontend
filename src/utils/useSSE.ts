// 解析SSE流，用fetch+ReadableStream而非EventSource(仅支持get方法，post方法得自己解析)
import { SSEEvent } from "@/types/usesse";

// const readSSE = async function* (response: Response): AsyncGenerator<SSEEvent> {
//     const reader = response.body?.getReader();
//     console.log('reader', reader);
//     if (!reader) throw new Error('response body不可读');
//     const decoder = new TextDecoder();
//     let buffer = '';
//     while (true) {
//         const { done, value } = await reader.read();
//         console.log('每一个切片', done, value);

//         if (done) break;
//         // stream为true允许跨chunk的多字节字符正确解码
//         buffer += decoder.decode(value, { stream: true });
//         console.log('转化', buffer);

//         // sse事件以空行分隔
//         let idx: number = buffer.indexOf('\n\n');
//         while (idx !== -1) {
//             const raw = buffer.slice(0, idx);
//             buffer = buffer.slice(idx + 2);
//             let eventName = 'message';
//             let dataStr = '';
//             for (const line of raw.split('\n')) {
//                 if (line.startsWith('event:')) {
//                     eventName = line.slice(6).trim();
//                 } else if (line.startsWith('data:')) {
//                     dataStr += line.slice(5).trim();
//                 }
//             }
//             if (!dataStr) continue;
//             try {
//                 yield { event: eventName, data: JSON.parse(dataStr) };
//             } catch {
//                 yield { event: eventName, data: dataStr };
//             }
//         }

//     }

// }

const readSSE = async function* (response: Response): AsyncGenerator<SSEEvent> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error('response body不可读');
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        while (true) {
            const posLF2 = buffer.indexOf('\n\n');
            const posCRLF2 = buffer.indexOf('\r\n\r\n');
            const positions: Array<{ pos: number; cut: number }> = [];
            if (posLF2 !== -1) positions.push({ pos: posLF2, cut: 2 });
            if (posCRLF2 !== -1) positions.push({ pos: posCRLF2, cut: 4 });
            if (positions.length === 0) break;

            // 取最先出现的分隔符
            const first = positions.sort((a, b) => a.pos - b.pos)[0];
            const rawBlock = buffer.slice(0, first.pos);
            buffer = buffer.slice(first.pos + first.cut);

            let eventName = 'message';
            let dataStr = '';
            let lastId: string | undefined;
            const lines = rawBlock.split(/\r?\n/);

            for (const line of lines) {
                if (line.startsWith('event:')) {
                    eventName = line.slice(6).trim();
                } else if (line.startsWith('data:')) {
                    // 多行data追加换行，符合SSE标准
                    dataStr += line.slice(5) + '\n';
                } else if (line.startsWith('id:')) {
                    lastId = line.slice(3).trim();
                }
                // : 注释行直接忽略
            }

            if (!dataStr) continue;
            // SSE多行data会自带末尾换行，去掉最后一个
            const payloadStr = dataStr.endsWith('\n') ? dataStr.slice(0, -1) : dataStr;
            // console.log('【SSE原始payload】', JSON.stringify(payloadStr)); // 重点！打印原始字符串，看真实内容

            try {
                const parsed = JSON.parse(payloadStr);
                yield { event: eventName, data: parsed, id: lastId };
            } catch (e) {
                console.error('SSE JSON解析失败！原始字符串：', JSON.stringify(payloadStr));
                yield { event: 'parse_error', data: { raw: payloadStr } };
            }
        }
    }
};




export default readSSE;