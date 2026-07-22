# Legacy — à la carte paket oluşturucu

`package-builder-client.tsx` eski (tek tek hizmet seçme) paket oluşturucudur.
Paket Oluştur V2 sihirbazına (`../_wizard/`) geçildiğinde rollback için burada
tutulur; sayfada artık render edilmiyor.

Rollback: `src/app/paket-olustur/page.tsx` içinde `PackageWizard` yerine
`PackageBuilderClient`'i (bu klasörden) import edip render edin.

Not: Bu bileşen `@/stores/package-store`, `@/components/package/*` gibi eski
CMS-tabanlı à la carte altyapısını kullanır; bu dosyalar silinmedi.
