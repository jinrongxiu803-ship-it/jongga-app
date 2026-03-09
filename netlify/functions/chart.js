exports.handler = async (event) => {
  const code = event.queryStringParameters?.code;
  if (!code) return { statusCode: 400, body: JSON.stringify({error: 'code required'}) };
  
  try {
    const res = await fetch(
      `https://finance.naver.com/item/sise_day.naver?code=${code}&page=1`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': `https://finance.naver.com/item/main.naver?code=${code}`,
          'Accept': 'text/html'
        }
      }
    );
    const html = await res.text();
    
    const rows = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) || [];
    const data = [];
    
    for (const row of rows) {
      const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/g) || [];
      if (cells.length < 7) continue;
      const getText = c => c.replace(/<[^>]+>/g, '').replace(/,/g, '').trim();
      const date = getText(cells[0]);
      const close = parseInt(getText(cells[1]));
      const volume = parseInt(getText(cells[6]));
      if (date && close && !isNaN(close)) {
        data.push({date, close, volume});
      }
      if (data.length >= 5) break;
    }
    
    return {
      statusCode: 200,
      headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
      body: JSON.stringify({code, data, ok: true})
    };
  } catch(e) {
    return {
      statusCode: 500,
      headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
      body: JSON.stringify({error: e.message})
    };
  }
};
