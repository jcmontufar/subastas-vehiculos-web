"use client";

import { onValue, ref } from "firebase/database";
import {
  CircleAlert,
  Gavel,
  LogIn,
  Timer,
  Trophy,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { formatCents, getAuctionStatus } from "@/lib/auction";
import { database } from "@/lib/firebase/client";
import type {
  AuctionUserState,
  PublicAuctionState,
  Vehicle,
} from "@/types/domain";
import { AuctionStatusBadge } from "./auction-status-badge";

function formatRemaining(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1_000));
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

export function AuctionPanel({ vehicle }: { vehicle: Vehicle }) {
  const { user, loading: authLoading } = useAuth();
  const [auction, setAuction] = useState<PublicAuctionState | null>(null);
  const [userStateEntry, setUserStateEntry] = useState<{
    uid: string;
    value: AuctionUserState | null;
  } | null>(null);
  const [serverOffset, setServerOffset] = useState(0);
  const [clock, setClock] = useState(0);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [realtimeError, setRealtimeError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/auctions/${vehicle.id}`, { signal: controller.signal })
      .then(async (response) => {
        const body = (await response.json()) as {
          data?: PublicAuctionState;
          serverNow?: number;
          error?: string;
        };
        if (!response.ok || !body.data) {
          throw new Error(body.error ?? "No fue posible cargar la subasta");
        }
        if (typeof body.serverNow === "number") {
          setServerOffset(body.serverNow - Date.now());
        }
        setClock(Date.now());
        setAuction(body.data);
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError")
          return;
        setError(
          reason instanceof Error
            ? reason.message
            : "No fue posible cargar la subasta",
        );
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [vehicle.id]);

  useEffect(() => {
    if (!database) return;
    const unsubscribeAuction = onValue(
      ref(database, `auctions/${vehicle.id}/public`),
      (snapshot) => {
        if (snapshot.exists()) setAuction(snapshot.val() as PublicAuctionState);
        setRealtimeError(false);
      },
      () => setRealtimeError(true),
    );
    const unsubscribeOffset = onValue(
      ref(database, ".info/serverTimeOffset"),
      (snapshot) => setServerOffset(Number(snapshot.val() ?? 0)),
    );
    return () => {
      unsubscribeAuction();
      unsubscribeOffset();
    };
  }, [vehicle.id]);

  useEffect(() => {
    if (!database || !user) return;
    return onValue(
      ref(database, `auctions/${vehicle.id}/userStates/${user.uid}`),
      (snapshot) =>
        setUserStateEntry({
          uid: user.uid,
          value: snapshot.exists()
            ? (snapshot.val() as AuctionUserState)
            : null,
        }),
      () => setRealtimeError(true),
    );
  }, [user, vehicle.id]);

  useEffect(() => {
    const interval = window.setInterval(() => setClock(Date.now()), 1_000);
    return () => window.clearInterval(interval);
  }, []);

  const serverNow = clock + serverOffset;
  const userState =
    userStateEntry && userStateEntry.uid === user?.uid
      ? userStateEntry.value
      : null;
  const status = auction
    ? getAuctionStatus(auction, serverNow)
    : getAuctionStatus(vehicle, serverNow);
  const countdown = useMemo(() => {
    if (!auction || status === "SOLD" || status === "UNSOLD") {
      return formatRemaining(0);
    }
    const target = new Date(
      status === "UPCOMING" ? auction.startAt : auction.endAt,
    ).getTime();
    return formatRemaining(target - serverNow);
  }, [auction, serverNow, status]);

  async function submitBid(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !auction || status !== "LIVE") return;
    setSubmitting(true);
    setError("");
    try {
      const token = await user.getIdToken(true);
      const response = await fetch(`/api/auctions/${vehicle.id}/bids`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        data?: {
          auction: PublicAuctionState;
          userState: AuctionUserState;
          serverNow: number;
        };
        auction?: PublicAuctionState;
        minimumNextBidCents?: number;
        error?: string;
      };
      if (!response.ok || !body.data) {
        if (body.auction) setAuction(body.auction);
        if (body.minimumNextBidCents) {
          setAmount((body.minimumNextBidCents / 100).toFixed(2));
        }
        throw new Error(body.error ?? "No fue posible registrar la oferta");
      }
      setAuction(body.data.auction);
      setUserStateEntry({ uid: user.uid, value: body.data.userState });
      setServerOffset(body.data.serverNow - Date.now());
      setAmount("");
      toast.success("Tu oferta fue registrada correctamente");
    } catch (reason) {
      const message =
        reason instanceof Error
          ? reason.message
          : "No fue posible registrar la oferta";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <section className="mt-8 rounded-2xl border border-blue-200 bg-white p-6 shadow-sm">
        <p className="animate-pulse font-semibold text-slate-500">
          Cargando subasta en tiempo real…
        </p>
      </section>
    );
  }

  if (!auction) {
    return (
      <section className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        <p className="font-bold">No fue posible cargar la subasta.</p>
        {error && <p className="mt-1 text-sm">{error}</p>}
      </section>
    );
  }

  const currentPrice = auction.currentBidCents ?? auction.basePriceCents;
  const final = status === "SOLD" || status === "UNSOLD";

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-sm">
      <div className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="flex items-center gap-2 text-xl font-black">
              <Gavel className="text-blue-600" /> Subasta en tiempo real
            </h2>
            <AuctionStatusBadge status={status} />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold tracking-wide text-slate-400 uppercase">
                Precio base
              </p>
              <p className="mt-1 text-xl font-black">
                {formatCents(auction.basePriceCents)}
              </p>
            </div>
            <div className="rounded-xl bg-blue-50 p-4">
              <p className="text-xs font-bold tracking-wide text-blue-500 uppercase">
                Oferta actual
              </p>
              <p className="mt-1 text-xl font-black text-blue-700">
                {auction.currentBidCents
                  ? formatCents(auction.currentBidCents)
                  : "Sin ofertas"}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold tracking-wide text-slate-400 uppercase">
                Próxima oferta mínima
              </p>
              <p className="mt-1 text-xl font-black">
                {formatCents(auction.minimumNextBidCents)}
              </p>
            </div>
          </div>

          {!final && (
            <div className="mt-5 flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 p-4">
              <Timer className="size-6 text-blue-600" />
              <div>
                <p className="text-xs font-bold tracking-wide text-slate-400 uppercase">
                  {status === "UPCOMING" ? "Comienza en" : "Tiempo restante"}
                </p>
                <div
                  className="mt-1 flex gap-3 font-mono text-lg font-black"
                  aria-live="polite"
                >
                  <span>{countdown.days}d</span>
                  <span>{String(countdown.hours).padStart(2, "0")}h</span>
                  <span>{String(countdown.minutes).padStart(2, "0")}m</span>
                  <span>{String(countdown.seconds).padStart(2, "0")}s</span>
                </div>
              </div>
            </div>
          )}

          {status === "LIVE" && userState?.isWinning && (
            <div
              className="mt-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800"
              role="status"
            >
              <Trophy className="size-5" />
              <strong>¡Vas ganando esta subasta!</strong>
            </div>
          )}
          {status === "LIVE" && userState?.hasBid && !userState.isWinning && (
            <div
              className="mt-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800"
              role="alert"
            >
              <CircleAlert className="size-5" />
              <strong>
                Tu oferta ha sido superada. ¡Haz tu oferta ahora antes de que
                termine el tiempo!
              </strong>
            </div>
          )}
          {status === "SOLD" && userState?.isWinning && (
            <div
              className="mt-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800"
              role="status"
            >
              <Trophy className="size-5" />
              <strong>¡Ganaste esta subasta!</strong>
            </div>
          )}
          {status === "UNSOLD" && (
            <p className="mt-5 rounded-xl bg-slate-100 p-4 font-bold text-slate-700">
              La subasta finalizó sin ofertas válidas.
            </p>
          )}
          {status === "SOLD" && (
            <p className="mt-5 text-sm font-semibold text-slate-600">
              Oferta ganadora: {formatCents(currentPrice)}
            </p>
          )}
        </div>

        <div className="w-full rounded-2xl border border-slate-200 p-5 lg:w-80">
          {!authLoading && !user ? (
            <div className="text-center">
              <LogIn className="mx-auto size-8 text-blue-600" />
              <p className="mt-3 font-bold">Inicia sesión para ofertar</p>
              <Link
                href={`/login?next=/vehiculos/${vehicle.id}`}
                className="mt-4 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-bold text-white"
              >
                Iniciar sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={submitBid}>
              <label
                htmlFor="bid-amount"
                className="text-sm font-bold text-slate-700"
              >
                Tu oferta (GTQ)
              </label>
              <input
                id="bid-amount"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                inputMode="decimal"
                placeholder={(auction.minimumNextBidCents / 100).toFixed(2)}
                disabled={status !== "LIVE" || submitting}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-lg font-bold outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100 disabled:bg-slate-100"
              />
              <button
                type="submit"
                disabled={status !== "LIVE" || submitting || !amount}
                className="mt-3 w-full rounded-xl bg-blue-600 px-5 py-3 font-bold text-white disabled:bg-slate-300"
              >
                {submitting ? "Validando oferta…" : "Confirmar oferta"}
              </button>
              {status === "UPCOMING" && (
                <p className="mt-3 text-sm text-slate-500">
                  Podrás ofertar cuando comience la subasta.
                </p>
              )}
              {final && (
                <p className="mt-3 text-sm font-semibold text-slate-500">
                  Esta subasta ya no admite ofertas.
                </p>
              )}
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            </form>
          )}
        </div>
      </div>
      {realtimeError && (
        <div className="flex items-center gap-2 border-t border-amber-200 bg-amber-50 px-6 py-3 text-sm text-amber-800">
          <WifiOff className="size-4" /> La actualización en tiempo real no está
          disponible. Revisa las reglas de Realtime Database.
        </div>
      )}
      <div className="border-t border-blue-100 bg-blue-50 px-6 py-3 text-sm text-blue-700">
        Cada oferta se valida y confirma mediante una transacción atómica en el
        servidor. Se han registrado {auction.bidCount} ofertas válidas.
      </div>
    </section>
  );
}
