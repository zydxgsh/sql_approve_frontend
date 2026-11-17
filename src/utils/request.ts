// get请求方法封装
const token = localStorage.getItem('token')
const serveGet = async (options: Record<string, any>) => {
    const url = options.url;
    if (!url) return;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }
    })
    const result = await response.json();
    return result
}

// post请求封装
const servePost = async (option: Record<string, any>) => {
    const { url, body = {}, headers = {}, isSSE = false } = option;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...headers,
        },
        body: JSON.stringify(body)
    })
    if (!response.ok) throw new Error(`post fail:${response.status}`)
    let result = response;
    if (!isSSE) {
        result = await response.json();
    }
    return result;
}


export { serveGet, servePost };

