import React from 'react';

interface OrderPrintFormProps {
  order: any;
  customer: any;
  fabric: any;
  createdByUser: any;
}

export const OrderPrintForm: React.FC<OrderPrintFormProps> = ({ 
  order, 
  customer, 
  fabric,
  createdByUser
}) => {
  // Sipariş tarihi ve termin tarihini formatla
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR');
  };

  // Metrajı formatla ve bin'lik ayırıcı ekle
  const formatMetraj = (quantity: string | number) => {
    if (!quantity) return '0';
    return Number(quantity).toLocaleString('tr-TR');
  };

  // Kumaş bilgilerinden tip açıklaması oluştur
  const fabricDescription = fabric ? `${fabric.name} ${fabric.code || ''}` : '';

  // Sipariş bilgilerinin detayları
  const orderDetails = {
    width: order?.width || (fabric?.properties?.en ? fabric.properties.en : ''),
    weight: order?.weight || (fabric?.properties?.gramaj ? fabric.properties.gramaj : ''),
    color: order?.color || (fabric?.properties?.renk ? fabric.properties.renk : ''),
    pattern: order?.pattern || (fabric?.properties?.desenVaryant ? fabric.properties.desenVaryant : ''),
    feel: order?.feel || (fabric?.properties?.tuse ? fabric.properties.tuse : ''),
    blend: order?.blend || (fabric?.properties?.harman ? fabric.properties.harman : ''),
    variant: order?.variant || (fabric?.properties?.desenVaryant ? fabric.properties.desenVaryant : ''),
    groupName: order?.groupName || (fabric?.properties?.grupAdi ? fabric.properties.grupAdi : ''),
    marketType: order?.marketType || 'iç'
  };

  return (
    <div className="w-[210mm] mx-auto bg-white p-6 print:p-4 print:shadow-none shadow-md font-sans">
      {/* Başlık Alanı */}
      <div className="flex justify-between items-center mb-4 border-b border-gray-300 pb-2">
        <div className="text-3xl font-bold text-black">
          Kimtex
        </div>
        <div className="text-xl text-gray-700 font-medium">
          Sipariş Formu
        </div>
      </div>

      {/* Üst Bilgiler */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="border border-gray-300">
          <div className="grid grid-cols-5">
            <div className="col-span-1 font-medium bg-gray-100 p-1 border-r border-gray-300">Müşteri</div>
            <div className="col-span-4 p-1">{customer?.name || order?.customerName || ''}</div>
          </div>
        </div>
        <div className="border border-gray-300">
          <div className="grid grid-cols-5">
            <div className="col-span-1 font-medium bg-gray-100 p-1 border-r border-b border-gray-300">Sip. No</div>
            <div className="col-span-4 p-1 border-b border-gray-300 font-medium">{order?.orderNumber}</div>
          </div>
          <div className="grid grid-cols-5">
            <div className="col-span-1 font-medium bg-gray-100 p-1 border-r border-b border-gray-300">Sip. Tarihi</div>
            <div className="col-span-4 p-1 border-b border-gray-300">{formatDate(order?.orderDate)}</div>
          </div>
          <div className="grid grid-cols-5">
            <div className="col-span-1 font-medium bg-gray-100 p-1 border-r border-gray-300">Termin</div>
            <div className="col-span-4 p-1">{formatDate(order?.dueDate)}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="border border-gray-300">
          <div className="grid grid-cols-2">
            <div className="col-span-1 font-medium bg-gray-100 p-1 border-r border-b border-gray-300">Sipariş Tipi</div>
            <div className="col-span-1 p-1 border-b border-gray-300">
              {order?.orderType === 'block' ? 'BLOK' : order?.orderType === 'block_color' ? 'RENK' : 'DİREKT'}
            </div>
          </div>
          <div className="grid grid-cols-2">
            <div className="col-span-1 font-medium bg-gray-100 p-1 border-r border-gray-300">Piyasa</div>
            <div className="col-span-1 p-1">
              {orderDetails.marketType?.toUpperCase() || 'İÇ'}
            </div>
          </div>
        </div>
        <div className="border border-gray-300">
          <div className="grid grid-cols-2">
            <div className="col-span-1 font-medium bg-gray-100 p-1 border-r border-b border-gray-300">Öncelik</div>
            <div className="col-span-1 p-1 border-b border-gray-300">{order?.isUrgent ? 'ACELELİ' : 'NORMAL'}</div>
          </div>
          <div className="grid grid-cols-2">
            <div className="col-span-1 font-medium bg-gray-100 p-1 border-r border-gray-300">Hazırlayan</div>
            <div className="col-span-1 p-1">{createdByUser?.fullName || ''}</div>
          </div>
        </div>
        <div className="border border-gray-300">
          <div className="grid grid-cols-2">
            <div className="col-span-1 font-medium bg-gray-100 p-1 border-r border-b border-gray-300">Miktar</div>
            <div className="col-span-1 p-1 border-b border-gray-300 text-right">
              {formatMetraj(order?.quantity || 0)} {order?.unit || 'Mt'}
            </div>
          </div>
          <div className="grid grid-cols-2">
            <div className="col-span-1 font-medium bg-gray-100 p-1 border-r border-gray-300">Kalite Std.</div>
            <div className="col-span-1 p-1">{order?.qualityStandard || 'STANDART'}</div>
          </div>
        </div>
      </div>

      {/* Kumaş Bilgileri */}
      <div className="mb-4">
        <div className="bg-gray-200 p-1 font-bold mb-1 text-sm">KUMAŞ BİLGİLERİ</div>
        <div className="grid grid-cols-4 gap-3">
          <div className="border border-gray-300">
            <div className="grid grid-cols-1">
              <div className="font-medium bg-gray-100 p-1 border-b border-gray-300 text-sm">Ürün Adı</div>
              <div className="p-1">{fabric?.name || ''}</div>
            </div>
          </div>
          <div className="border border-gray-300">
            <div className="grid grid-cols-1">
              <div className="font-medium bg-gray-100 p-1 border-b border-gray-300 text-sm">Kumaş Kodu</div>
              <div className="p-1">{fabric?.code || ''}</div>
            </div>
          </div>
          <div className="border border-gray-300">
            <div className="grid grid-cols-1">
              <div className="font-medium bg-gray-100 p-1 border-b border-gray-300 text-sm">En (cm)</div>
              <div className="p-1">{orderDetails.width}</div>
            </div>
          </div>
          <div className="border border-gray-300">
            <div className="grid grid-cols-1">
              <div className="font-medium bg-gray-100 p-1 border-b border-gray-300 text-sm">Gramaj (g/m²)</div>
              <div className="p-1">{orderDetails.weight}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="border border-gray-300">
          <div className="grid grid-cols-1">
            <div className="font-medium bg-gray-100 p-1 border-b border-gray-300 text-sm">Renk</div>
            <div className="p-1">{orderDetails.color}</div>
          </div>
        </div>
        <div className="border border-gray-300">
          <div className="grid grid-cols-1">
            <div className="font-medium bg-gray-100 p-1 border-b border-gray-300 text-sm">Desen</div>
            <div className="p-1">{orderDetails.pattern}</div>
          </div>
        </div>
        <div className="border border-gray-300">
          <div className="grid grid-cols-1">
            <div className="font-medium bg-gray-100 p-1 border-b border-gray-300 text-sm">Tuşe</div>
            <div className="p-1">{orderDetails.feel}</div>
          </div>
        </div>
        <div className="border border-gray-300">
          <div className="grid grid-cols-1">
            <div className="font-medium bg-gray-100 p-1 border-b border-gray-300 text-sm">Harman</div>
            <div className="p-1">{orderDetails.blend}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="border border-gray-300">
          <div className="grid grid-cols-1">
            <div className="font-medium bg-gray-100 p-1 border-b border-gray-300 text-sm">Desen Varyant</div>
            <div className="p-1">{orderDetails.variant}</div>
          </div>
        </div>
        <div className="border border-gray-300">
          <div className="grid grid-cols-1">
            <div className="font-medium bg-gray-100 p-1 border-b border-gray-300 text-sm">Grup Adı</div>
            <div className="p-1">{orderDetails.groupName}</div>
          </div>
        </div>
        <div className="col-span-2 border border-gray-300">
          <div className="grid grid-cols-1">
            <div className="font-medium bg-gray-100 p-1 border-b border-gray-300 text-sm">Notlar</div>
            <div className="p-1 h-8 overflow-hidden text-xs">{order?.notes || ''}</div>
          </div>
        </div>
      </div>

      {/* MAMÜL SİPARİŞ AÇIKLAMASI */}
      <div className="mb-4">
        <div className="bg-gray-200 p-1 font-bold mb-1 text-sm">MAMÜL SİPARİŞ AÇIKLAMASI</div>
        <table className="w-full border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-1 text-left w-16">SL Nosu</th>
              <th className="border border-gray-300 p-1 text-left">Tip Açıklaması</th>
              <th className="border border-gray-300 p-1 text-left">Renk / Desen</th>
              <th className="border border-gray-300 p-1 text-left w-20">Metraj</th>
              <th className="border border-gray-300 p-1 text-left w-20">Termin</th>
              <th className="border border-gray-300 p-1 text-left w-16">Tuşe</th>
              <th className="border border-gray-300 p-1 text-left w-20">USER</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 p-1">
                {order?.orderNumber?.split('-')[2] || ''}.1
                <div className="text-xs text-gray-600">
                  {orderDetails.weight ? `${orderDetails.weight} g/m²` : ''}
                </div>
              </td>
              <td className="border border-gray-300 p-1 uppercase">{fabricDescription}</td>
              <td className="border border-gray-300 p-1">
                {orderDetails.color} / {orderDetails.pattern}
              </td>
              <td className="border border-gray-300 p-1 text-right">
                {formatMetraj(order?.quantity || 0)} {order?.unit || 'Mt'}
              </td>
              <td className="border border-gray-300 p-1">{formatDate(order?.dueDate)}</td>
              <td className="border border-gray-300 p-1">{orderDetails.feel || 'STD'}</td>
              <td className="border border-gray-300 p-1 text-center">
                {createdByUser?.fullName?.split(' ')[0]?.toUpperCase() || ''}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Sipariş Detayları */}
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div className="border border-gray-300">
          <div className="grid grid-cols-1">
            <div className="font-medium bg-gray-100 p-1 border-b border-gray-300 text-sm">Dokuma Notu</div>
            <div className="p-1 h-8"></div>
          </div>
        </div>
        
        <div className="border border-gray-300">
          <div className="grid grid-cols-1">
            <div className="font-medium bg-gray-100 p-1 border-b border-gray-300 text-sm">Planlama Notu</div>
            <div className="p-1 h-8"></div>
          </div>
        </div>
      </div>

      {/* Onay Tablosu */}
      <div className="mb-2">
        <div className="bg-gray-200 p-1 font-bold mb-1 text-sm">ONAYLAR</div>
        <table className="w-full border border-gray-300 text-xs">
          <tbody>
            <tr className="bg-gray-100">
              <td className="border border-gray-300 p-1 text-center font-medium">DESEN BÜRO</td>
              <td className="border border-gray-300 p-1 text-center font-medium">PLANLAMA</td>
              <td className="border border-gray-300 p-1 text-center font-medium">DOKUMA</td>
              <td className="border border-gray-300 p-1 text-center font-medium">SATIŞ SORUMLUSU</td>
              <td className="border border-gray-300 p-1 text-center font-medium">SATINALMA</td>
              <td className="border border-gray-300 p-1 text-center font-medium">YÖNETİM</td>
            </tr>
            <tr className="h-12">
              <td className="border border-gray-300 p-1"></td>
              <td className="border border-gray-300 p-1"></td>
              <td className="border border-gray-300 p-1"></td>
              <td className="border border-gray-300 p-1"></td>
              <td className="border border-gray-300 p-1"></td>
              <td className="border border-gray-300 p-1"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer bilgileri */}
      <div className="text-xs text-gray-500 border-t border-gray-200 pt-1 mt-1">
        <div className="flex justify-between">
          <div>Sipariş No: {order?.orderNumber}</div>
          <div>Yazdırma Tarihi: {new Date().toLocaleDateString('tr-TR')}</div>
        </div>
      </div>
    </div>
  );
};

export default OrderPrintForm;