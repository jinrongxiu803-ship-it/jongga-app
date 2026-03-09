exports.handler = async (event) => {
  const code = event.queryStringParameters?.code;
  if (!code) return { statusCode: 400, body: JSON.stringify({error: 'code required'}) };
  
  try {
    const res = await fetch(
      `https://finance.naver.com/item/sise.naver?code=${code}`,
      { 
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://finance.naver.com',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'ko-KR,ko;q=0.9'
        } 
      }
    );
    const html = await res.text();
    
    const get = (id) => {
      const m = html.match(new RegExp(`id="${id}"[^>]*>([0-9,+\\-.]+)`));
      return m ? m[1].replace(/,/g, '') : null;
    };

    const price = parseInt(get('_nowVal') || get('_closeVal') || 0);
    const change = parseInt(get('_change') || 0);
    const rate = parseFloat(get('_rate') || 0);
    const volume = parseInt(get('_volume') || 0);

    const highM = html.match(/고가[^0-9]*([0-9,]+)/);
    const lowM  = html.match(/저가[^0-9]*([0-9,]+)/);
    const high = highM ? parseInt(highM[1].replace(/,/g,'')) : price;
    const low  = lowM  ? parseInt(lowM[1].replace(/,/g,''))  : price;

    const kst = new Date(new Date().toLocaleString('en-US', {timeZone:'Asia/Seoul'}));
    const h = kst.getHours(), m2 = kst.getMinutes();
    const isOpen = h >= 9 && (h < 15 || (h === 15 && m2 < 30));
    const isWeekend = kst.getDay() === 0 || kst.getDay() === 6;
    const marketStatus = isWeekend ? 'WEEKEND' : isOpen ? 'OPEN' : 'CLOSED';

    if (!price) {
      return {
        statusCode: 404,
        headers: {'Content-Type':'application/json','Access-Control-Allow-Origin':'*'},
        body: JSON.stringify({error:'price not found', code})
      };
    }
    
    return {
      statusCode: 200,
      headers: {'Content-Type':'application/json','Access-Control-Allow-Origin':'*'},
      body: JSON.stringify({code, price, change, rate, volume, high, low, marketStatus, ok:true})
    };
  } catch(e) {
    return {
      statusCode: 500,
      headers: {'Content-Type':'application/json','Access-Control-Allow-Origin':'*'},
      body: JSON.stringify({error: e.message})
    };
  }
};
