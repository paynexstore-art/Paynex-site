import { useState, useEffect, useCallback } from 'react';
import { Camera, CheckCircle, Clock, Lock, MapPin, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import {
  getAttendanceRecords, getSupervisors, saveAttendanceRecord,
  updateAttendanceRecord, lockSupervisor
} from '@/lib/storage';
import { getCurrentGps, isWithinProvince } from '@/lib/geofencing';
import FaceAttendance from '@/components/features/FaceAttendance';
import type { AttendanceRecord, Supervisor, GpsCoords } from '@/types';
import { toast } from 'sonner';

export default function SupervisorAttendance() {
  const { user } = useAuth();
  const { t } = useApp();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [supervisor, setSupervisor] = useState<Supervisor | null>(null);
  const [tab, setTab] = useState<'check-in' | 'check-out'>('check-in');
  const [gps, setGps] = useState<GpsCoords | null>(null);
  const [gpsChecking, setGpsChecking] = useState(false);
  const [gpsVerified, setGpsVerified] = useState(false);

  const reload = useCallback(() => {
    if (!user) return;
    setRecords(getAttendanceRecords(user.id));
    const sup = getSupervisors().find(s => s.id === user.id);
    setSupervisor(sup ?? null);
  }, [user]);

  useEffect(() => { reload(); }, [reload]);

  const todayStr = new Date().toDateString();
  const todayRecord = records.find(r => r.date === todayStr);
  const checkedIn  = !!todayRecord?.checkInTime;
  const checkedOut = !!todayRecord?.checkOutTime;

  const now = new Date();
  const currentHour = now.getHours() * 100 + now.getMinutes();
  const workStart   = supervisor ? parseInt(supervisor.workHoursStart.replace(':', '')) : 900;
  const workEnd     = supervisor ? parseInt(supervisor.workHoursEnd.replace(':', '')) : 1700;
  const isWorkTime  = currentHour >= workStart && currentHour <= workEnd;

  async function verifyGps() {
    setGpsChecking(true);
    const coords = await getCurrentGps();
    setGpsChecking(false);
    if (!coords) {
      // Demo: allow without GPS
      setGpsVerified(true);
      toast.warning(t('GPS غير متاح — تم التجاوز في وضع التجربة', 'GPS unavailable — bypassed in demo mode'));
      return;
    }
    setGps(coords);
    const inProvince = isWithinProvince(coords, supervisor?.province ?? '');
    if (!inProvince) {
      toast.error(t('أنت خارج نطاق محافظتك المسجلة — لا يمكن تسجيل الحضور', 'You are outside your registered province — attendance blocked'));
      return;
    }
    setGpsVerified(true);
    toast.success(t('تم التحقق من موقعك بنجاح', 'Location verified successfully'));
  }

  function handleCheckInSuccess() {
    // Save attendance record
    const existing = records.find(r => r.date === todayStr);
    if (!existing) {
      saveAttendanceRecord({
        supervisorId: user!.id,
        date: todayStr,
        checkInTime: new Date().toISOString(),
        checkInGps: gps ?? undefined,
        status: isWorkTime ? 'present' : 'late',
        faceVerified: true,
        location: supervisor?.province,
      });
    } else {
      updateAttendanceRecord(user!.id, todayStr, {
        checkInTime: new Date().toISOString(),
        checkInGps: gps ?? undefined,
        faceVerified: true,
      });
    }
    reload();
    toast.success(t('تم تسجيل الحضور بنجاح', 'Check-in successful'));
  }

  function handleCheckOutSuccess() {
    updateAttendanceRecord(user!.id, todayStr, {
      checkOutTime: new Date().toISOString(),
      checkOutGps: gps ?? undefined,
    });
    // Lock account after check-out — must settle debt before next day
    if (supervisor?.id) lockSupervisor(supervisor.id);
    reload();
    toast.success(t('تم تسجيل الانصراف — تذكر تسليم العهدة للمدير', 'Check-out recorded — remember to settle custody with admin'));
  }

  return (
    <div className="space-y-5">
      {/* Work Status */}
      <div className={`rounded-2xl p-4 flex items-center gap-3 ${isWorkTime ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
        <Clock size={20} className={isWorkTime ? 'text-green-600' : 'text-yellow-600'} />
        <div>
          <p className={`font-semibold ${isWorkTime ? 'text-green-800' : 'text-yellow-800'}`}>
            {isWorkTime ? t('أنت في وقت الدوام الرسمي', 'Within official work hours') : t('خارج وقت الدوام الرسمي', 'Outside official work hours')}
          </p>
          {supervisor && (
            <p className="text-sm text-slate-500">
              {t(`أوقات الدوام: ${supervisor.workHoursStart} - ${supervisor.workHoursEnd}`, `Work hours: ${supervisor.workHoursStart} - ${supervisor.workHoursEnd}`)}
            </p>
          )}
        </div>
      </div>

      {/* Lock Warning */}
      {supervisor?.isLocked && (
        <div className="bg-red-50 border border-red-300 rounded-2xl p-4 flex items-start gap-3">
          <Lock size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-800">{t('حسابك مقفل — عهدة غير مسلّمة', 'Account Locked — Unsettled Custody')}</p>
            <p className="text-red-600 text-sm mt-1">
              {t('يجب تسليم العهدة النقدية للمدير العام وتأكيد الاستلام منه لفتح حسابك والمتابعة.',
                'You must deliver your daily cash custody to the Super Admin for account unlock.')}
            </p>
            <p className="text-red-500 text-xs mt-1 font-mono">
              {t(`المبلغ المستحق: ${supervisor.pendingDebt?.toLocaleString() ?? 0} ج.م`, `Amount due: EGP ${supervisor.pendingDebt?.toLocaleString() ?? 0}`)}
            </p>
          </div>
        </div>
      )}

      {/* Today's Status Cards */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <h3 className="font-bold text-[#0f2460] mb-4">{t('حالة اليوم', "Today's Status")}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-4 rounded-xl border-2 text-center ${checkedIn ? 'border-green-300 bg-green-50' : 'border-slate-200 bg-slate-50'}`}>
            <CheckCircle size={28} className={`mx-auto mb-2 ${checkedIn ? 'text-green-500' : 'text-slate-300'}`} />
            <div className="font-semibold text-sm">{t('تسجيل الحضور', 'Check In')}</div>
            {todayRecord?.checkInTime ? (
              <div className="text-xs text-green-600 mt-1">
                {new Date(todayRecord.checkInTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                {todayRecord.faceVerified && <span className="ms-1 font-bold"> ✓ {t('وجه', 'Face')}</span>}
              </div>
            ) : <div className="text-xs text-slate-400 mt-1">{t('لم يتم بعد', 'Not done')}</div>}
          </div>
          <div className={`p-4 rounded-xl border-2 text-center ${checkedOut ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}>
            <CheckCircle size={28} className={`mx-auto mb-2 ${checkedOut ? 'text-blue-500' : 'text-slate-300'}`} />
            <div className="font-semibold text-sm">{t('تسجيل الانصراف', 'Check Out')}</div>
            {todayRecord?.checkOutTime ? (
              <div className="text-xs text-blue-600 mt-1">
                {new Date(todayRecord.checkOutTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
              </div>
            ) : <div className="text-xs text-slate-400 mt-1">{t('لم يتم بعد', 'Not done')}</div>}
          </div>
        </div>
      </div>

      {/* GPS Verification Step */}
      {!supervisor?.isLocked && !checkedOut && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
          {/* Step 1: GPS */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${gpsVerified ? 'bg-green-500 text-white' : 'bg-[#0f2460] text-white'}`}>1</div>
              <h4 className="font-semibold text-slate-700">{t('التحقق من الموقع الجغرافي', 'GPS Location Verification')}</h4>
              {gpsVerified && <CheckCircle size={16} className="text-green-500" />}
            </div>
            {!gpsVerified ? (
              <button onClick={verifyGps} disabled={gpsChecking}
                className="btn-outline w-full flex items-center justify-center gap-2 text-sm">
                <MapPin size={16} />
                {gpsChecking ? t('جاري التحقق...', 'Verifying...') : t('التحقق من موقعي', 'Verify My Location')}
              </button>
            ) : (
              <div className="bg-green-50 rounded-xl p-3 text-xs text-green-700 flex items-center gap-2">
                <CheckCircle size={14} />
                {gps
                  ? t(`الموقع مؤكد: ${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}`, `Location confirmed: ${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}`)
                  : t('الموقع مؤكد (وضع التجربة)', 'Location confirmed (demo mode)')}
              </div>
            )}
          </div>

          {/* Step 2: Face Scan */}
          {gpsVerified && (!checkedIn || (checkedIn && !checkedOut)) && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-full bg-[#0f2460] text-white flex items-center justify-center text-xs font-bold">2</div>
                <h4 className="font-semibold text-slate-700">{t('التحقق ببصمة الوجه', 'Face Recognition')}</h4>
              </div>
              <div className="flex gap-2 mb-3">
                {!checkedIn && (
                  <button onClick={() => setTab('check-in')}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${tab === 'check-in' ? 'bg-[#0f2460] text-white border-[#0f2460]' : 'border-slate-200'}`}>
                    <Camera size={14} className="inline me-1" />{t('حضور', 'Check In')}
                  </button>
                )}
                {checkedIn && !checkedOut && (
                  <button onClick={() => setTab('check-out')}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${tab === 'check-out' ? 'bg-red-500 text-white border-red-500' : 'border-slate-200'}`}>
                    <Camera size={14} className="inline me-1" />{t('انصراف', 'Check Out')}
                  </button>
                )}
              </div>
              <FaceAttendance
                type={tab}
                onSuccess={tab === 'check-in' ? handleCheckInSuccess : handleCheckOutSuccess}
              />
            </div>
          )}
        </div>
      )}

      {/* History */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <h3 className="font-bold text-[#0f2460] mb-4">{t('سجل الحضور', 'Attendance History')}</h3>
        {records.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-4">{t('لا سجلات حضور بعد', 'No records yet')}</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {records.slice(0, 30).map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${r.status === 'present' ? 'bg-green-500' : r.status === 'late' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                  <span className="font-medium">{r.date}</span>
                  {r.faceVerified && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Face ✓</span>}
                  {r.checkInGps && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">GPS ✓</span>}
                </div>
                <div className="text-xs text-slate-500 flex gap-3">
                  {r.checkInTime  && <span>{t('دخول', 'In')}: {new Date(r.checkInTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>}
                  {r.checkOutTime && <span>{t('خروج', 'Out')}: {new Date(r.checkOutTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
