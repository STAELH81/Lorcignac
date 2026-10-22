'use strict';
const byId=id=>document.getElementById(id);
const input=byId('file'),quality=byId('quality'),status=byId('status'),result=byId('result');
let resultUrl=null,loadedInfo=null;
quality.addEventListener('input',()=>{byId('val').textContent=quality.value+' %'});
byId('format').addEventListener('change',()=>{quality.disabled=byId('format').value==='image/png'});
function showFile(file){result.hidden=true;loadedInfo=file;byId('original').textContent=file?file.name+' — '+Math.round(file.size/1024)+' Ko':'Aucun fichier sélectionné.';}
input.addEventListener('change',()=>showFile(input.files[0]));
const drop=byId('drop');
drop.addEventListener('dragover',ev=>{ev.preventDefault();drop.classList.add('drag')});
drop.addEventListener('dragleave',()=>drop.classList.remove('drag'));
drop.addEventListener('drop',ev=>{ev.preventDefault();drop.classList.remove('drag');if(ev.dataTransfer.files.length){input.files=ev.dataTransfer.files;showFile(input.files[0]);}});
const toBlob=(canvas,type,q)=>new Promise(resolve=>canvas.toBlob(resolve,type,q));
byId('go').addEventListener('click',async()=>{
result.hidden=true;
const file=input.files[0]||loadedInfo;
if(!file){status.textContent='Veuillez sélectionner une image.';return;}
if(!['image/jpeg','image/png','image/webp'].includes(file.type)){status.textContent='Format non pris en charge : JPEG, PNG ou WebP uniquement.';return;}
if(file.size>30*1024*1024){status.textContent='Fichier trop volumineux (limite 30 Mo).';return;}
let image=null;
try{
status.textContent='Conversion en cours…';
image=await createImageBitmap(file);
const max=Number(byId('width').value),ratio=max===0?1:Math.min(1,max/image.width);
const w=Math.max(1,Math.round(image.width*ratio)),h=Math.max(1,Math.round(image.height*ratio));
const angle=Number(byId('rotate').value),turn=angle===90||angle===270;
const canvas=document.createElement('canvas');canvas.width=turn?h:w;canvas.height=turn?w:h;
if(canvas.width*canvas.height>40000000)throw Error('Image trop grande pour ce navigateur.');
const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas indisponible.');
const type=byId('format').value;
if(type==='image/jpeg'){ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);}
ctx.translate(canvas.width/2,canvas.height/2);ctx.rotate(angle*Math.PI/180);
ctx.drawImage(image,-w/2,-h/2,w,h);
const blob=await toBlob(canvas,type,Number(quality.value)/100);
if(!blob)throw Error('Impossible de produire le fichier.');
if(resultUrl)URL.revokeObjectURL(resultUrl);resultUrl=URL.createObjectURL(blob);
const ext=blob.type==='image/png'?'png':blob.type==='image/webp'?'webp':'jpg';
byId('preview').src=resultUrl;const dl=byId('download');dl.href=resultUrl;dl.download=(file.name.replace(/\.[^.]+$/,'')||'photo')+'-pixelpoche.'+ext;
const pct=Math.round((1-blob.size/file.size)*100);
byId('info').textContent=canvas.width+' × '+canvas.height+' pixels — '+Math.round(blob.size/1024)+' Ko (original : '+Math.round(file.size/1024)+' Ko)'+(pct>=0?' — '+pct+' % de moins':' — fichier plus lourd que l’original');
result.hidden=false;status.textContent='Terminé ! Votre image est prête.';
}catch(err){status.textContent='Erreur : '+err.message}finally{if(image)image.close();}
});
window.addEventListener('pagehide',()=>{if(resultUrl)URL.revokeObjectURL(resultUrl)});
