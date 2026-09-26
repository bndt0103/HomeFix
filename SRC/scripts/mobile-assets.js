import sharp from 'sharp';import fs from 'node:fs';
const root='frontend/android/app/src/main/res';
for(const [density,size,foreground] of [['mdpi',48,108],['hdpi',72,162],['xhdpi',96,216],['xxhdpi',144,324],['xxxhdpi',192,432]]){
 const dir=`${root}/mipmap-${density}`;fs.mkdirSync(dir,{recursive:true});
 for(const name of ['ic_launcher','ic_launcher_round'])await sharp('frontend/public/icon.svg').resize(size,size).png().toFile(`${dir}/${name}.png`);
 const icon=await sharp('frontend/public/icon.svg').resize(Math.round(foreground*.6)).toBuffer();
 await sharp({create:{width:foreground,height:foreground,channels:4,background:'#ffffff00'}}).composite([{input:icon,gravity:'centre'}]).png().toFile(`${dir}/ic_launcher_foreground.png`);
}
console.log('HomeFix launcher icons generated.');
