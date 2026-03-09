import { useAuth } from '@/contexts/AuthContext';
import { ReusableMaterialsManager } from '@/components/settings/ReusableMaterialsManager';
import { getCurrencyByCode } from '@/lib/currencies';

const InventoryReusables = () => {
  const { profile } = useAuth();
  const currency = getCurrencyByCode(profile?.currency || 'MXN');

  return (
    <div className="pt-16 md:pt-4 p-3 sm:p-4 md:p-6 max-w-5xl mx-auto">
      <ReusableMaterialsManager currencySymbol={currency.symbol} />
    </div>
  );
};

export default InventoryReusables;
