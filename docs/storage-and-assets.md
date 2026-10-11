# Storage and image workflow

## Buckets

| Bucket | Access | Use |
| --- | --- | --- |
| `site-media` | Public reads; manager-only writes/deletes | Public club, event, alumni, and website images |
| `member-media` | Private reads for active society members and authorized team managers; manager-only writes/deletes | Private team profile images |

Both buckets accept JPEG, PNG, WebP, AVIF, and GIF. The bucket limit is 10 MiB per file. The frontend offers one image field per record form and disables the input after a successful upload. It does not overwrite existing objects.

The current project has a 50 MB Storage quota. Keep each upload small and check Storage usage in Supabase before adding more media. Postgres RLS and Storage object policies authorize the upload based on the user's database permission and, for club managers, the club folder. A public bucket is intentionally public once an image is uploaded there.

## Object paths

Uploads are placed under a typed path, for example:

- `clubs/<club-slug>/<uuid>.webp`
- `events/<club-slug>/<uuid>.webp`
- `team/<club-slug>/<uuid>.webp`
- `content/<content-type>/<uuid>.webp`

Public records store a `site-media` public URL. Private member records store a `storage://member-media/<path>` reference; the server signs it for a short time after an authorized database read.

## Replacing old website images

The existing content migration preserves valid image references so the pages remain populated. Those references currently point to the old site's public assets. An administrator can replace the image from the corresponding `/manage` form: upload one image, then save the record. Replacing a URL does not automatically delete the old Storage object; remove unused objects from Supabase Storage after checking no record references them.

## Setup

The bucket definitions and object policies are managed by the backend migrations. Do not make a bucket public to simplify private team access. Never put a service-role key in a browser bundle or a `NEXT_PUBLIC_` variable.
