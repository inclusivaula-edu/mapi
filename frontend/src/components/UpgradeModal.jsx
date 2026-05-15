export default function UpgradeModal({ open, onClose, onUpgrade }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-2xl w-96 shadow-xl">
        <h2 className="text-xl font-bold mb-2">🚀 Upgrade necessário</h2>

        <p className="text-gray-600 mb-4">
          Você atingiu o limite do plano gratuito.
        </p>

        <ul className="text-sm mb-6 space-y-1">
          <li>✅ Mais requisições</li>
          <li>✅ Acesso completo à IA</li>
          <li>✅ Melhor performance</li>
        </ul>

        <button
          onClick={onUpgrade}
          className="w-full bg-black text-white py-2 rounded-xl mb-2"
        >
          Fazer Upgrade
        </button>

        <button
          onClick={onClose}
          className="w-full text-gray-500 text-sm"
        >
          Agora não
        </button>
      </div>
    </div>
  );
}