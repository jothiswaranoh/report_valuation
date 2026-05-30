export const getStatusColor = (status: string) => {
    switch (status) {
        case 'draft': return 'bg-amber-50 text-amber-600 border-amber-100';
        case 'review': return 'bg-orange-50 text-orange-600 border-orange-100';
        case 'approved': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
};
