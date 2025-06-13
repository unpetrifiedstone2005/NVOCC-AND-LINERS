"use client";
import { LocateFixed, MapPin, Anchor } from "lucide-react";
import { useState, useEffect, useRef, ChangeEvent} from "react";


type DeliveryType = 'door' | 'terminal';
type WeightUnit = 'kg' | 'lb';

interface FormData {
  startLocation: string;
  endLocation: string;
  pickupType: DeliveryType;
  deliveryType: DeliveryType;
  validFrom: string;
  shipperOwnedContainer: boolean;
  containerType: string;
  containerQuantity: string;
  weightPerContainer: string;
  weightUnit: WeightUnit;
  dangerousGoods: boolean;
  imoClass: string;
  multipleContainerTypes: boolean;
  unNumber: string;
  commodity: string;
}



export const SchedulesComponent: React.FC = () => {

    const [formData, setFormData] = useState<FormData>({
        startLocation: '',
        endLocation: '',
        pickupType: 'terminal',
        deliveryType: 'terminal',
        validFrom: '2025-06-08',
        shipperOwnedContainer: false,
        multipleContainerTypes: false,
        containerType: '40-general',
        containerQuantity: '1',
        weightPerContainer: '20000',
        weightUnit: 'kg',
        dangerousGoods: false,
        imoClass: '',
        unNumber: '',
        commodity: 'FAK'
    });
      

    const handleInputChange = (field: keyof FormData, value: string | boolean) => {
         setFormData(prev => ({ ...prev, [field]: value }));

    };
    
    const radioButtonStyle = "w-4 h-4 accent-[#1d4595] bg-[#373737] border-2 border-black";
     const sectionStyle =
    "max-w-[1600.24px] rounded-xl shadow-[40px_4  0px_0px_rgba(0,0,0,1)] p-6  py-[26px] border-white border-2";
 

  return (
    <div className="max-w-[1600.24px] mx-auto w-full px-4 ">
     <div
    className={`${sectionStyle} p-10 shadow-[40px_40px_0px_rgba(0,0,0,1)]`}
    style={{
      backgroundImage: `
        linear-gradient(to bottom left, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%),
        linear-gradient(to bottom right, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%)
      `,
      backgroundBlendMode: 'overlay',
    }}
  >
    <h2 className="text-xl font-bold text-[#faf9f6] mb-6 flex items-center gap-2">
      SEARCH
    </h2>
    <hr className="my-2 border-t border-white" />
    <br />

    {/* wrap everything in a 2-col grid */}
    <div className="grid md:grid-cols-2 gap-8 mb-6">
      {/* ——— Left column ——— */}
      <div className="space-y-6">
        {/* End Location */}
        <div className="space-y-4">
          <label className="block text-md text-[#faf9f6] font-light mb-2">
            START LOCATION
          </label>
          <div className="relative group">
            <input
              type="text"
              value={formData.endLocation}
              onChange={(e) => handleInputChange('endLocation', e.target.value)}
              className={`w-full uppercase text-sm bg-[#2D4D8B] rounded-xl hover:bg-[#0A1A2F] hover:text-[#00FFFF] hover:placeholder-[#00FFFF] placeholder-[#faf9f6] text-[#faf9f6] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border-black border-4 px-3 py-2 font-bold pl-12`}
              placeholder="Location name or code"
            />
            <MapPin size={20} color="white" className="absolute left-3 top-3 group-hover:stroke-[#00FFFF]" />
          </div>
    {/* delivery radios */}
          <div className="flex items-center gap-6 mt-2">
            <label className="flex items-center gap-2 text-[#faf9f6] font-bold">
              <input
                type="radio"
                checked={formData.deliveryType === 'door'}
                onChange={() => handleInputChange('deliveryType', 'door')}
                className={radioButtonStyle}
              />
              Delivered to your Door
            </label>
            <label className="flex items-center gap-2 text-[#faf9f6] font-bold">
              <input
                type="radio"
                checked={formData.deliveryType === 'terminal'}
                onChange={() => handleInputChange('deliveryType', 'terminal')}
                className={radioButtonStyle}
              />
                 Delivered to Terminal/Ramp
            </label>
          </div>
        </div>

        {/* Start Date */}
        <div>
              <label className="block text-md text-[#faf9f6] font-light mb-2 mt-5">START DATE</label>
              <input
                type="date"
                value={formData.validFrom}
                onChange={(e) => handleInputChange('validFrom', e.target.value)}
                className="rounded-xl hover:text-[#00FFFF] placeholder-[#faf9f6] text-white shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border-black border-4 px-3 py-2 font-bold bg-[#11235d] w-full "
              />
            </div>

         {/* US Flag only toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.multipleContainerTypes /* reuse any boolean */}
                onChange={(e) => handleInputChange('multipleContainerTypes', e.target.checked)}
                className="toggle toggle-primary"
              />
              <span className="text-[#faf9f6] font-bold">US Flag only</span>
            </div>
      </div>
      

      {/* ——— Right column ——— */}
      <div className="space-y-6">
        {/* End Location */}
        <div className="space-y-4">
          <label className="block text-md text-[#faf9f6] font-light mb-2">
            END LOCATION
          </label>
          <div className="relative group">
            <input
              type="text"
              value={formData.endLocation}
              onChange={(e) => handleInputChange('endLocation', e.target.value)}
              className={`w-full uppercase text-sm bg-[#2D4D8B] hover:placeholder-[#00FFFF] rounded-xl hover:bg-[#0A1A2F] hover:text-[#00FFFF] placeholder-[#faf9f6] text-[#faf9f6] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border-black border-4 px-3 py-2 font-bold pl-12`}
              placeholder="Location name or code"
            />
            <MapPin size={20} color="white" className="absolute left-3 top-3 group-hover:stroke-[#00FFFF]" />
          </div>
    {/* delivery radios */}
          <div className="flex items-center gap-6 mt-2">
            <label className="flex items-center gap-2 text-[#faf9f6] font-bold">
              <input
                type="radio"
                checked={formData.deliveryType === 'door'}
                onChange={() => handleInputChange('deliveryType', 'door')}
                className={radioButtonStyle}
              />
              Delivered to your Door
            </label>
            <label className="flex items-center gap-2 text-[#faf9f6] font-bold">
              <input
                type="radio"
                checked={formData.deliveryType === 'terminal'}
                onChange={() => handleInputChange('deliveryType', 'terminal')}
                className={radioButtonStyle}
              />
              Delivered to Terminal/Ramp
            </label>
          </div>
        </div>

        {/* Container Type */}
        <div>
          <label className="block text-md text-[#faf9f6] font-light mb-2">CONTAINER TYPE</label>
          <div className="flex items-center gap-7">
            <select
            value={formData.containerType}
            onChange={(e) => handleInputChange('containerType', e.target.value)}
            className="rounded-xl hover:text-[#00FFFF] placeholder-[#faf9f6] text-white shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border-black border-4 px-3 py-2 font-bold bg-[#11235d] w-1/2 mr-4"
          >
            <option value="20-general">20' GP HC</option>
            <option value="40-general">40' GP HC</option>
            <option value="40-hc">40' HC</option>
            <option value="45-hc">45' HC</option>
          </select>

           <div className="flex items-center">
            <input
                type="checkbox"
                checked={formData.dangerousGoods}
                onChange={(e) => handleInputChange('dangerousGoods', e.target.checked)}
                className="w-5 h-5 accent-[#00FFFF] bg-[#373737] border-2 border-black mr-3"
          />
          <span className="text-[#faf9f6] font-bold">Dangerous Goods</span>
           </div>
            
          
          
          </div>
          
          
        </div>
      </div>
    </div>

    {/* Clear + Find buttons */}
    <div className="flex justify-end gap-4 mt-8">
      <button
        className="bg-[#0A1A2F] rounded-3xl hover:bg-[#2D4D8B] hover:text-[#00FFFF] text-[#faf9f6] px-6 py-2 text-lg shadow-[7px_7px_0px_rgba(0,0,0,1)] hover:shadow-[15px_5px_0px_rgba(0,0,0,1)]"
      >
        Clear
      </button>
      <button
        className="bg-[#0A1A2F] rounded-3xl hover:bg-[#2D4D8B] hover:text-[#00FFFF] text-[#faf9f6] px-6 py-2 text-lg shadow-[7px_7px_0px_rgba(0,0,0,1)] hover:shadow-[15px_5px_0px_rgba(0,0,0,1)]"
      >
        Find
      </button>
    </div>
  </div>
  </div>
  );
};
