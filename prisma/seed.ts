import 'dotenv/config'
import * as fs from 'fs'
import * as path from 'path'
import csvParser from 'csv-parser'
import prisma from '../src/lib/prisma'

// ユーティリティ：CSVを読み込んで配列にする（ヘッダー行を無視してインデックスでアクセス）
async function parseMasterCsv(filePath: string): Promise<Array<{ code: number; name: string }>> {
  return new Promise((resolve, reject) => {
    const results: Array<{ code: number; name: string }> = []
    fs.createReadStream(filePath)
      .pipe(csvParser({ headers: false, skipLines: 1 }))
      .on('data', (data) => {
        const code = parseInt(data[0], 10)
        const name = data[1]?.trim()
        if (!isNaN(code) && code !== 0 && name) {
          results.push({ code, name })
        }
      })
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error))
  })
}

// ユーティリティ：数値に変換（NaNや0の場合はnull）
const parseCode = (val: string | undefined): number | null => {
  if (!val) return null
  const num = parseInt(val, 10)
  return isNaN(num) || num === 0 ? null : num
}

// ユーティリティ：数値に変換（NaNの場合はnull）
const parseCount = (val: string | undefined): number | null => {
  if (!val) return null
  const num = parseInt(val, 10)
  return isNaN(num) ? null : num
}

async function main() {
  console.log('シードデータのインポートを開始します...')
  const dataSourceDir = path.join(process.cwd(), 'data_source')

  const seenNames = new Set<string>()

  // 1. 猫種マスターのインポート
  console.log('猫種データをインポート中...')
  const breeds = await parseMasterCsv(path.join(dataSourceDir, '猫種データUTF8Ver.csv'))
  seenNames.clear()
  for (const b of breeds) {
    let finalName = b.name
    let counter = 2
    while (seenNames.has(finalName)) {
      finalName = `${b.name} (${counter})`
      counter++
    }
    seenNames.add(finalName)
    
    await prisma.breed.upsert({
      where: { code: b.code },
      update: { name: finalName },
      create: { code: b.code, name: finalName },
    })
  }
  console.log(`猫種データのインポート完了: ${breeds.length}件`)

  // 2. 色柄マスターのインポート
  console.log('色柄データをインポート中...')
  const coatColors = await parseMasterCsv(path.join(dataSourceDir, '色柄データUTF8Ver.csv'))
  seenNames.clear()
  for (const c of coatColors) {
    let finalName = c.name
    let counter = 2
    while (seenNames.has(finalName)) {
      finalName = `${c.name} (${counter})`
      counter++
    }
    seenNames.add(finalName)

    await prisma.coatColor.upsert({
      where: { code: c.code },
      update: { name: finalName },
      create: { code: c.code, name: finalName },
    })
  }
  console.log(`色柄データのインポート完了: ${coatColors.length}件`)

  // 3. 性別マスターのインポート
  console.log('性別データをインポート中...')
  const genders = await parseMasterCsv(path.join(dataSourceDir, '性別データUTF8Ver.csv'))
  seenNames.clear()
  for (const g of genders) {
    let finalName = g.name
    let counter = 2
    while (seenNames.has(finalName)) {
      finalName = `${g.name} (${counter})`
      counter++
    }
    seenNames.add(finalName)

    await prisma.gender.upsert({
      where: { code: g.code },
      update: { name: finalName },
      create: { code: g.code, name: finalName },
    })
  }
  console.log(`性別データのインポート完了: ${genders.length}件`)

  // 4. 血統書データのインポート（バッチ処理）
  console.log('血統書データをインポート中...')
  const pedigreesPath = path.join(dataSourceDir, '血統書データRenamed.csv')
  
  let batch: any[] = []
  let count = 0
  
  const readStream = fs.createReadStream(pedigreesPath).pipe(csvParser())
  
  for await (const row of readStream) {
    const pedigreeId = row['PedigreeID']?.trim()
    if (!pedigreeId) continue // PedigreeIDがない行はスキップ

    batch.push({
      pedigreeId: pedigreeId,
      title: row['Title']?.trim() || null,
      catName: row['CatName']?.trim() || null,
      catName2: row['CatName2']?.trim() || null,
      breedCode: parseCode(row['BreedCode']),
      genderCode: parseCode(row['GenderCode']),
      eyeColor: row['EyeColor']?.trim() || null,
      coatColorCode: parseCode(row['CoatColorCode']),
      birthDate: row['BirthDate']?.trim() || null,
      breederName: row['BreederName']?.trim() || null,
      ownerName: row['OwnerName']?.trim() || null,
      registrationDate: row['RegistrationDate']?.trim() || null,
      brotherCount: parseCount(row['BrotherCount']),
      sisterCount: parseCount(row['SisterCount']),
      notes: row['Notes']?.trim() || null,
      notes2: row['Notes2']?.trim() || null,
      otherNo: row['OtherNo']?.trim() || null,
      fatherTitle: row['FatherTitle']?.trim() || null,
      fatherCatName: row['FatherName']?.trim() || null, // FatherName -> fatherCatName
      fatherCatName2: row['FatherCatName2']?.trim() || null,
      fatherCoatColor: row['FatherCoatColor']?.trim() || null,
      fatherEyeColor: row['FatherEyeColor']?.trim() || null,
      fatherJCU: row['FatherJCU']?.trim() || null,
      fatherOtherCode: row['FatherOtherCode']?.trim() || null,
      motherTitle: row['MotherTitle']?.trim() || null,
      motherCatName: row['MotherCatName']?.trim() || null,
      motherCatName2: row['MotherCatName2']?.trim() || null,
      motherCoatColor: row['MotherCoatColor']?.trim() || null,
      motherEyeColor: row['MotherEyeColor']?.trim() || null,
      motherJCU: row['MotherJCU']?.trim() || null,
      motherOtherCode: row['MotherOtherCode']?.trim() || null,
      ffTitle: row['FFTitle']?.trim() || null,
      ffCatName: row['FFCatName']?.trim() || null,
      ffCatColor: row['FFCatColor']?.trim() || null,
      ffjcu: row['FFJCU']?.trim() || null, // Note: Schema lowercases these jcu fields except mapped
      fmTitle: row['FMTitle']?.trim() || null,
      fmCatName: row['FMCatName']?.trim() || null,
      fmCatColor: row['FMCatColor']?.trim() || null,
      fmjcu: row['FMJCU']?.trim() || null,
      mfTitle: row['MFTitle']?.trim() || null,
      mfCatName: row['MFCatName']?.trim() || null,
      mfCatColor: row['MFCatColor']?.trim() || null,
      mfjcu: row['MFJCU']?.trim() || null,
      mmTitle: row['MMTitle']?.trim() || null,
      mmCatName: row['MMCatName']?.trim() || null,
      mmCatColor: row['MMCatColor']?.trim() || null,
      mmjcu: row['MMJCU']?.trim() || null,
      fffTitle: row['FFFTitle']?.trim() || null,
      fffCatName: row['FFFCatName']?.trim() || null,
      fffCatColor: row['FFFCatColor']?.trim() || null,
      fffjcu: row['FFFJCU']?.trim() || null,
      ffmTitle: row['FFMTitle']?.trim() || null,
      ffmCatName: row['FFMCatName']?.trim() || null,
      ffmCatColor: row['FFMCatColor']?.trim() || null,
      ffmjcu: row['FFMJCU']?.trim() || null,
      fmfTitle: row['FMFTitle']?.trim() || null,
      fmfCatName: row['FMFCatName']?.trim() || null,
      fmfCatColor: row['FMFCatColor']?.trim() || null,
      fmfjcu: row['FMFJCU']?.trim() || null,
      fmmTitle: row['FMMTitle']?.trim() || null,
      fmmCatName: row['FMMCatName']?.trim() || null,
      fmmCatColor: row['FMMCatColor']?.trim() || null,
      fmmjcu: row['FMMJCU']?.trim() || null,
      mffTitle: row['MFFTitle']?.trim() || null,
      mffCatName: row['MFFCatName']?.trim() || null,
      mffCatColor: row['MFFCatColor']?.trim() || null,
      mffjcu: row['MFFJCU']?.trim() || null,
      mfmTitle: row['MFMTitle']?.trim() || null,
      mfmCatName: row['MFMCatName']?.trim() || null,
      mfmCatColor: row['MFMCatColor']?.trim() || null,
      mfmjcu: row['MFMJCU']?.trim() || null,
      mmfTitle: row['MMFTitle']?.trim() || null,
      mmfCatName: row['MMFCatName']?.trim() || null,
      mmfCatColor: row['MMFCatColor']?.trim() || null,
      mmfjcu: row['MMFJCU']?.trim() || null,
      mmmTitle: row['MMMTitle']?.trim() || null,
      mmmCatName: row['MMMCatName']?.trim() || null,
      mmmCatColor: row['MMMCatColor']?.trim() || null,
      mmmjcu: row['MMMJCU']?.trim() || null,
      oldCode: row['OldCode']?.trim() || null,
    })

    if (batch.length >= 1000) {
      await prisma.pedigree.createMany({
        data: batch,
        skipDuplicates: true, // 同じPedigreeIDがある場合はスキップ
      })
      count += batch.length
      console.log(`血統書データ インポート進捗: ${count}件`)
      batch = []
    }
  }

  // 残りのバッチを処理
  if (batch.length > 0) {
    await prisma.pedigree.createMany({
      data: batch,
      skipDuplicates: true,
    })
    count += batch.length
    console.log(`血統書データ インポート進捗: ${count}件`)
  }

  console.log('すべてのインポートが完了しました！')
}

main()
  .catch((e) => {
    console.error('インポート中にエラーが発生しました:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
