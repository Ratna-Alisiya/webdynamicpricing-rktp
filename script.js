const video=document.getElementById('video');
const canvas=document.getElementById('canvas');
const ctx=canvas.getContext('2d');
const resultDiv=document.getElementById('result');
const historyTable=document.getElementById('historyTable');
const cameraSelect=document.getElementById('cameraSelect');

let historyData=JSON.parse(localStorage.getItem('scanHistory'))||[];
let stream;

const references=[
  {name:'Sangat Layak',rgb:{r:75,g:9,b:12},price:'Rp 20.000'},
  {name:'Masih Layak',rgb:{r:101,g:7,b:5},price:'Rp 15.000'},
  {name:'Kurang Layak',rgb:{r:245,g:197,b:66},price:'Rp 10.000'},

  // ⭐ Updated "Tidak Layak" — yellow-brown
  {name:'Tidak Layak',rgb:{r:200,g:140,b:55},price:'Rp 0'}
];

async function startCamera(facingMode='environment'){
  if(stream){stream.getTracks().forEach(t=>t.stop());}
  try{
    stream=await navigator.mediaDevices.getUserMedia({
      video:{facingMode:{exact:facingMode}}, audio:false
    });
    video.srcObject=stream; video.play();
  }catch(e){
    alert("Akses kamera gagal. Aktifkan izin kamera.");
    console.error(e);
  }
}

window.addEventListener("load",()=>startCamera("environment"));

cameraSelect.addEventListener("change",()=>startCamera(cameraSelect.value));

function scanColor(){
  canvas.width=video.videoWidth;
  canvas.height=video.videoHeight;
  ctx.drawImage(video,0,0,canvas.width,canvas.height);
  const imageData=ctx.getImageData(0,0,canvas.width,canvas.height);
  let r=0,g=0,b=0;
  for(let i=0;i<imageData.data.length;i+=4){
    r+=imageData.data[i];
    g+=imageData.data[i+1];
    b+=imageData.data[i+2];
  }
  const count=imageData.data.length/4;
  return {r:Math.round(r/count),g:Math.round(g/count),b:Math.round(b/count)};
}

function distance(c1,c2){
  return Math.sqrt((c1.r-c2.r)**2+(c1.g-c2.g)**2+(c1.b-c2.b)**2);
}

function evaluateQuality(rgb){
  let best=references[0];
  let min=distance(rgb,references[0].rgb);
  for(let i=1;i<references.length;i++){
    const d=distance(rgb,references[i].rgb);
    if(d<min){min=d; best=references[i];}
  }
  return {quality:best.name,price:best.price};
}

document.getElementById('scanBtn').addEventListener('click',()=>{
  const rgb=scanColor();
  const {quality,price}=evaluateQuality(rgb);
  const time=new Date().toLocaleString();
  resultDiv.innerHTML=`RGB: (${rgb.r},${rgb.g},${rgb.b})<br>Kualitas: ${quality}<br>Harga: ${price}`;
  historyData.push({time,rgb,quality,price});
  localStorage.setItem('scanHistory',JSON.stringify(historyData));
  renderHistory();
});

function renderHistory(){
  historyTable.innerHTML='';
  historyData.forEach(item=>{
    historyTable.innerHTML+=`<tr>
      <td>${item.time}</td>
      <td>(${item.rgb.r},${item.rgb.g},${item.rgb.b})</td>
      <td>${item.quality}</td>
      <td>${item.price}</td>
    </tr>`;
  });
}

document.getElementById('exportBtn').addEventListener('click',()=>{
  let csv="data:text/csv;charset=utf-8,Waktu,RGB,Kualitas,Harga\n";
  historyData.forEach(i=>{
    csv+=`${i.time},"(${i.rgb.r},${i.rgb.g},${i.rgb.b})",${i.quality},${i.price}\n`;
  });
  const link=document.createElement("a");
  link.href=encodeURI(csv);
  link.download="scan_history.csv";
  link.click();
});

renderHistory();