'use client';

import React, { useMemo, useState } from 'react';
import { usePedigreeStore } from '@/store/usePedigreeStore';
import { FormInput } from './FormInput';
import { getDuplicateIdentifiers } from '@/utils/duplicateChecker';
import { getPedigreeByJcu } from '@/actions/pedigreeActions';
import { generateCatCompositeId } from '@/utils/idGenerator';
import { Pedigree } from '@prisma/client';

export default function PedigreeForm() {
  const { formData, updateField, mergeAncestryData } = usePedigreeStore();
  const duplicates = useMemo(() => getDuplicateIdentifiers(formData), [formData]);
  const [loadingParent, setLoadingParent] = useState<'father' | 'mother' | null>(null);
  const [openSection, setOpenSection] = useState<'gen1' | 'gen2' | 'gen3' | null>('gen1');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof Pedigree) => {
    updateField(field, e.target.value);
  };

  const handleFetchParent = async (jcu: string, role: 'father' | 'mother') => {
    if (!jcu) return;
    setLoadingParent(role);
    try {
      const parentRecord = await getPedigreeByJcu(jcu);
      if (parentRecord) {
        mergeAncestryData(parentRecord, role);
      } else {
        alert(`${role} record not found for JCU: ${jcu}`);
      }
    } catch (error) {
      console.error(error);
      alert('Error fetching parent data');
    } finally {
      setLoadingParent(null);
    }
  };

  const compositeId = generateCatCompositeId(
    formData.breedCode,
    formData.coatColorCode,
    formData.genderCode,
    formData.pedigreeId
  );

  return (
    <div className="bg-gray-100 p-4 text-sm max-w-5xl mx-auto border border-gray-400">
      
      {/* Header and Action Buttons */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">新規登録 (New Pedigree)</h2>
        <div className="flex gap-2">
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded shadow text-sm font-medium">新規登録</button>
          <button className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-1.5 rounded shadow text-sm font-medium">登録</button>
        </div>
      </div>

      <div className="w-full pb-2">
        <div className="min-w-full md:min-w-[900px]">
          {/* Top Section: Self Info */}
          <div className="bg-white mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-t border-l border-gray-400">
              
              {/* Col 1: ID, Name, Breed, Color */}
              <div className="flex flex-col flex-1">
                <div className="flex">
                  <FormInput label="本猫ID" value={formData.pedigreeId || ''} onChange={(e) => handleChange(e, 'pedigreeId')} isDuplicate={duplicates.has(formData.pedigreeId || '')} className="flex-[2]" />
                  <FormInput label="性別" value={formData.genderCode || ''} onChange={(e) => updateField('genderCode', parseInt(e.target.value) || null)} type="number" className="flex-1" />
                </div>
                <FormInput label="名前" value={formData.catName || ''} onChange={(e) => handleChange(e, 'catName')} />
                <FormInput label="猫種" value={formData.breedCode || ''} onChange={(e) => updateField('breedCode', parseInt(e.target.value) || null)} type="number" />
                <FormInput label="色柄" value={formData.coatColorCode || ''} onChange={(e) => updateField('coatColorCode', parseInt(e.target.value) || null)} type="number" />
              </div>
              
              {/* Col 2: Birthday, Eye, Breeder, Owner, Registration */}
              <div className="flex flex-col flex-1">
                <FormInput label="誕生日" value={formData.birthDate || ''} onChange={(e) => handleChange(e, 'birthDate')} />
                <FormInput label="目色" value={formData.eyeColor || ''} onChange={(e) => handleChange(e, 'eyeColor')} />
                <FormInput label="繁殖者" value={formData.breederName || ''} onChange={(e) => handleChange(e, 'breederName')} />
                <FormInput label="所有者" value={formData.ownerName || ''} onChange={(e) => handleChange(e, 'ownerName')} />
                <FormInput label="登録日" value={formData.registrationDate || ''} onChange={(e) => handleChange(e, 'registrationDate')} />
              </div>
              
              {/* Col 3: Siblings, Notes, Other No */}
              <div className="flex flex-col flex-1">
                <div className="flex">
                  <FormInput label="兄弟M" value={formData.brotherCount || ''} onChange={(e) => updateField('brotherCount', parseInt(e.target.value) || null)} type="number" className="flex-1 w-1/2" />
                  <FormInput label="姉妹F" value={formData.sisterCount || ''} onChange={(e) => updateField('sisterCount', parseInt(e.target.value) || null)} type="number" className="flex-1 w-1/2 border-l-0" />
                </div>
                <FormInput label="摘要1" value={formData.notes || ''} onChange={(e) => handleChange(e, 'notes')} />
                <FormInput label="摘要2" value={formData.notes2 || ''} onChange={(e) => handleChange(e, 'notes2')} />
                <FormInput label="他No" value={formData.otherNo || ''} onChange={(e) => handleChange(e, 'otherNo')} />
                <FormInput label="本猫No" value={compositeId} readOnly className="bg-gray-100" />
              </div>

            </div>
          </div>

          {/* 3-Generation Tree Section */}
          <div className="flex flex-col md:grid md:grid-cols-3 gap-0 border-gray-400">
            
            {/* Gen 1: Call ID & Parents */}
            <div className="flex flex-col h-full">
              <button className="md:hidden flex justify-between items-center bg-gray-200 hover:bg-gray-300 p-2 font-bold text-sm border-b border-r border-gray-400 w-full text-left text-red-600 transition-colors" onClick={() => setOpenSection(openSection === 'gen1' ? null : 'gen1')}>
                <span>🐾 Generation 1 (父母)</span>
                <span>{openSection === 'gen1' ? '▲' : '▼'}</span>
              </button>
              
              <div className={`${openSection === 'gen1' ? 'flex' : 'hidden'} md:!flex flex-col flex-1 h-full`}>
                
                {/* Paternal Half (Top) */}
                <div className="flex-1 flex flex-col justify-end">
                  {/* Father (Gen 1) at the bottom */}
                  <div className="flex flex-col">
                    <div className="font-bold text-red-600 text-xs px-2 py-1 hidden md:block">🐾 Generation_1</div>
                    <div className="bg-blue-200 flex flex-col border-t border-l border-gray-400">
                      <FormInput label="FCH登録" value={formData.fatherTitle || ''} onChange={(e) => handleChange(e, 'fatherTitle')} />
                      <FormInput label="F名前" value={formData.fatherCatName || ''} onChange={(e) => handleChange(e, 'fatherCatName')} />
                      <FormInput label="F目色" value={formData.fatherEyeColor || ''} onChange={(e) => handleChange(e, 'fatherEyeColor')} />
                      <FormInput label="F色柄" value={formData.fatherCoatColor || ''} onChange={(e) => handleChange(e, 'fatherCoatColor')} />
                      <FormInput label="Fナンバー" value={formData.fatherJCU || ''} onChange={(e) => handleChange(e, 'fatherJCU')} isDuplicate={duplicates.has(formData.fatherJCU || '')} />
                    </div>
                  </div>
                </div>

                {/* Maternal Half (Bottom) */}
                <div className="flex-1 flex flex-col justify-start">
                  {/* Mother (Gen 1) at the top */}
                  <div className="bg-pink-200 flex flex-col border-l border-gray-400">
                    <FormInput label="MCH登録" value={formData.motherTitle || ''} onChange={(e) => handleChange(e, 'motherTitle')} />
                    <FormInput label="M名前" value={formData.motherCatName || ''} onChange={(e) => handleChange(e, 'motherCatName')} />
                    <FormInput label="M目色" value={formData.motherEyeColor || ''} onChange={(e) => handleChange(e, 'motherEyeColor')} />
                    <FormInput label="M色柄" value={formData.motherCoatColor || ''} onChange={(e) => handleChange(e, 'motherCoatColor')} />
                    <FormInput label="Mナンバー" value={formData.motherJCU || ''} onChange={(e) => handleChange(e, 'motherJCU')} isDuplicate={duplicates.has(formData.motherJCU || '')} />
                  </div>
                  {/* Spacer for alignment */}
                  <div className="font-bold text-transparent text-xs px-2 py-1 hidden md:block pointer-events-none select-none">🐾</div>
                  {/* Empty space below Mother with cat silhouette */}
                  <div className="flex-1 bg-transparent relative overflow-hidden hidden md:block">
                      <span className="absolute bottom-4 right-4 text-gray-300 text-8xl opacity-30 select-none">🐈‍⬛</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Gen 2: Grandparents */}
            <div className="flex flex-col h-full">
              <button className="md:hidden flex justify-between items-center bg-gray-200 hover:bg-gray-300 p-2 font-bold text-sm border-b border-r border-gray-400 w-full text-left text-red-600 transition-colors" onClick={() => setOpenSection(openSection === 'gen2' ? null : 'gen2')}>
                <span>🐾 Generation 2 (祖父母)</span>
                <span>{openSection === 'gen2' ? '▲' : '▼'}</span>
              </button>
              
              <div className={`${openSection === 'gen2' ? 'flex' : 'hidden'} md:!flex flex-col flex-1 h-full`}>
                
                {/* Paternal Half */}
                <div className="flex-1 flex flex-col justify-between">
                  {/* Top Group: Spacer + Call ID Block */}
                  <div>
                    {/* Spacer to align Call ID perfectly with Gen 3 inputs */}
                    <div className="font-bold text-transparent text-xs px-2 py-1 hidden md:block pointer-events-none select-none">🐾 Spacer</div>
                    
                    {/* Call ID Block (Moved from Gen 1) */}
                    <div className="bg-transparent flex flex-col border-t border-l border-gray-400 md:-ml-[1px]">
                      <FormInput label="両親ID" placeholder="未実装" disabled className="opacity-50" />
                      <div className="flex relative">
                        <FormInput label="父猫ID" value={formData.fatherJCU || ''} onChange={(e) => handleChange(e, 'fatherJCU')} onBlur={(e) => handleFetchParent(e.target.value, 'father')} isDuplicate={duplicates.has(formData.fatherJCU || '')} className="flex-1" />
                        {loadingParent === 'father' && <span className="absolute right-2 top-3 text-xs text-blue-500 font-bold z-20">Loading...</span>}
                      </div>
                      <div className="flex relative">
                        <FormInput label="母猫ID" value={formData.motherJCU || ''} onChange={(e) => handleChange(e, 'motherJCU')} onBlur={(e) => handleFetchParent(e.target.value, 'mother')} isDuplicate={duplicates.has(formData.motherJCU || '')} className="flex-1" />
                        {loadingParent === 'mother' && <span className="absolute right-2 top-3 text-xs text-pink-500 font-bold z-20">Loading...</span>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col mt-auto">
                    <div className="font-bold text-red-600 text-xs px-2 py-1 hidden md:block">🐾 Generation_2</div>
                    <div className="bg-blue-100 flex flex-col border-t border-l border-gray-400 md:-ml-[1px]"><Gen2Block prefix="FF" formData={formData} handleChange={handleChange} duplicates={duplicates} /></div>
                    <div className="bg-blue-100 flex flex-col border-l border-gray-400 md:-ml-[1px]"><Gen2Block prefix="FM" formData={formData} handleChange={handleChange} duplicates={duplicates} /></div>
                  </div>
                </div>

                {/* Maternal Half */}
                <div className="flex-1 flex flex-col justify-start">
                  <div className="bg-pink-100 flex flex-col border-l border-gray-400 md:-ml-[1px]"><Gen2Block prefix="MF" formData={formData} handleChange={handleChange} duplicates={duplicates} /></div>
                  <div className="bg-pink-100 flex flex-col border-l border-gray-400 md:-ml-[1px]"><Gen2Block prefix="MM" formData={formData} handleChange={handleChange} duplicates={duplicates} /></div>
                  {/* Spacer for alignment */}
                  <div className="font-bold text-transparent text-xs px-2 py-1 hidden md:block pointer-events-none select-none">🐾</div>
                  <div className="flex-1 bg-transparent hidden md:block"></div>
                </div>

              </div>
            </div>

            {/* Gen 3: Great-Grandparents */}
            <div className="flex flex-col h-full">
              <button className="md:hidden flex justify-between items-center bg-gray-200 hover:bg-gray-300 p-2 font-bold text-sm border-b border-r border-gray-400 w-full text-left text-red-600 transition-colors" onClick={() => setOpenSection(openSection === 'gen3' ? null : 'gen3')}>
                <span>🐾 Generation 3 (曾祖父母)</span>
                <span>{openSection === 'gen3' ? '▲' : '▼'}</span>
              </button>
              
              <div className={`${openSection === 'gen3' ? 'flex' : 'hidden'} md:!flex flex-col flex-1 h-full`}>
                
                {/* Paternal Half */}
                <div className="flex-1 flex flex-col justify-end">
                  <div className="font-bold text-red-600 text-xs px-2 py-1 hidden md:block">🐾 Generation_3</div>
                  <Gen3Block prefix="FFF" formData={formData} handleChange={handleChange} duplicates={duplicates} bgClass="bg-blue-50 border-t border-l border-gray-400 md:-ml-[1px]" />
                  <Gen3Block prefix="FFM" formData={formData} handleChange={handleChange} duplicates={duplicates} bgClass="bg-blue-50 border-l border-gray-400 md:-ml-[1px]" />
                  <Gen3Block prefix="FMF" formData={formData} handleChange={handleChange} duplicates={duplicates} bgClass="bg-blue-50 border-l border-gray-400 md:-ml-[1px]" />
                  <Gen3Block prefix="FMM" formData={formData} handleChange={handleChange} duplicates={duplicates} bgClass="bg-blue-50 border-l border-gray-400 md:-ml-[1px]" />
                </div>

                {/* Maternal Half */}
                <div className="flex-1 flex flex-col justify-start">
                  <Gen3Block prefix="MFF" formData={formData} handleChange={handleChange} duplicates={duplicates} bgClass="bg-pink-50 border-l border-gray-400 md:-ml-[1px]" />
                  <Gen3Block prefix="MFM" formData={formData} handleChange={handleChange} duplicates={duplicates} bgClass="bg-pink-50 border-l border-gray-400 md:-ml-[1px]" />
                  <Gen3Block prefix="MMF" formData={formData} handleChange={handleChange} duplicates={duplicates} bgClass="bg-pink-50 border-l border-gray-400 md:-ml-[1px]" />
                  <Gen3Block prefix="MMM" formData={formData} handleChange={handleChange} duplicates={duplicates} bgClass="bg-pink-50 border-l border-gray-400 md:-ml-[1px]" />
                  {/* Spacer for alignment */}
                  <div className="font-bold text-transparent text-xs px-2 py-1 hidden md:block pointer-events-none select-none">🐾</div>
                  <div className="flex-1 bg-transparent hidden md:block"></div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

const Gen2Block = ({ prefix, formData, handleChange, duplicates }: any) => {
  const titleKey = `${prefix.toLowerCase()}Title` as keyof Pedigree;
  const nameKey = `${prefix.toLowerCase()}CatName` as keyof Pedigree;
  const colorKey = `${prefix.toLowerCase()}CatColor` as keyof Pedigree;
  const jcuKey = `${prefix.toLowerCase()}jcu` as keyof Pedigree;
  return (
    <>
      <FormInput label={`${prefix}-CH登録`} value={formData[titleKey] || ''} onChange={(e) => handleChange(e, titleKey)} />
      <FormInput label={`${prefix}-名前`} value={formData[nameKey] || ''} onChange={(e) => handleChange(e, nameKey)} />
      <FormInput label={`${prefix}-色柄`} value={formData[colorKey] || ''} onChange={(e) => handleChange(e, colorKey)} />
      <FormInput label={`${prefix}-ナンバー`} value={formData[jcuKey] || ''} onChange={(e) => handleChange(e, jcuKey)} isDuplicate={duplicates.has(formData[jcuKey] || '')} />
    </>
  );
};

// Sub-component for Gen 3 blocks
const Gen3Block = ({ 
  prefix, 
  formData, 
  handleChange, 
  duplicates,
  bgClass
}: { 
  prefix: string, 
  formData: any, 
  handleChange: (e: React.ChangeEvent<HTMLInputElement>, field: keyof Pedigree) => void,
  duplicates: Set<string>,
  bgClass: string
}) => {
  const titleKey = `${prefix.toLowerCase()}Title` as keyof Pedigree;
  const nameKey = `${prefix.toLowerCase()}CatName` as keyof Pedigree;
  const jcuKey = `${prefix.toLowerCase()}jcu` as keyof Pedigree;

  return (
    <div className={`${bgClass} flex flex-col`}>
      <FormInput label={`${prefix}-CH登録`} value={formData[titleKey] || ''} onChange={(e) => handleChange(e, titleKey)} />
      <FormInput label={`${prefix}-名前`} value={formData[nameKey] || ''} onChange={(e) => handleChange(e, nameKey)} />
      <FormInput label={`${prefix}-ナンバー`} value={formData[jcuKey] || ''} onChange={(e) => handleChange(e, jcuKey)} isDuplicate={duplicates.has(formData[jcuKey] || '')} />
    </div>
  );
};
