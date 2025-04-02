+++
template = "blank.html"
sort_by = "weight"
+++

{% image_with_banner(image="build_only/images/cover.png") %}

Making Disciples of All Nations. <br>In the heart of Clayton, Monash.

{% end %}

<div class="py-8">

{{ title_with_highlight(title="Join a **service**") }}

<div class="grid md:grid-cols-3 gap-2 px-8">

{% card_with_image(image="build_only/images/morning_church.png", title="Morning") %}

- Service starts: 10AM
- Childrens program for all ages.

{% end %}

{% card_with_image(image="build_only/images/mandarin_service.jpg", title="Mandarin") %}

- Service starts: 2PM

{% end %}

{% card_with_image(image="build_only/images/night_church.png", title="Night") %}

- Service starts: 5PM
- Dinner provided after service.

{% end %}

</div>

</div>

<div class="bg-zinc-900 py-8">

{{ title_with_highlight(title="Be **transformed** by gospel-centred sermons") }}

{{ sermon_series() }}

<div class="psuedo h-8"></div>

{{ livestream_button() }}

</div>

<div class="py-8">

{{ title_with_highlight(title="Be **equipped** to make disciples in community") }}

<div class="text-xl md:px-20 px-8 font-bold">

Missional Communities (MCs) are small groups committed to being formed by Jesus
in community for the sake of others. We usually meet weekly in homes for a time
of eating, praying for each other, studying God’s word and on occasion serving
the community.

{{ simple_image(
  image="build_only/images/mc.png",
  container_class="p-4 flex justify-center"
  image_class="max-h-[30vh] max-w-[80vw] min-[900px]:max-w-[720px] rounded-md"
  desc="mc gathering"
  sizes="(min-width: 900px) 720px, (min-width: 700px) calc(71.11vw + 62px), calc(89.47vw - 64px)"
)}}

</div>

<div class="flex justify-center gap-2 md:px-4 px-2">

{{ get_connected_button() }}

{{ mc_locations_button() }}

</div>

</div>

<div class="bg-zinc-800 py-8">

{{ title_with_highlight(title="Get in **touch**") }}

<div class="text-xl md:px-20 px-8 font-bold pb-4">

We are a church community in Clayton, across the street from Monash University
Clayton campus.

</div>

{{ regen_map() }}

</div>
