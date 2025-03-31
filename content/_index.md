+++
template = "blank.html"
sort_by = "weight"
+++

{% image_with_banner(image="build_only/images/cover.png") %}

Making Disciples of All Nations.
<br>
In the heart of Clayton, Monash.

{% end %}

<div class="py-8">

{% title_with_highlight() %}

Join a **service**

{% end %}

<div class="grid md:grid-cols-3 gap-2 px-8 mx-auto">

{% card_with_image(image="build_only/images/morning_church.png", title="Morning") %}

- Service starts: 10AM
- Childrens program for all ages.

{% end %}

{% card_with_image(image="build_only/images/mandarin_service.jpg", title="Mandarin") %}

- Service starts: 2PM
- Jan: 12th, 26th. Feb: 9th, 23rd. March-onward: weekly.

{% end %}

{% card_with_image(image="build_only/images/night_church.png", title="Night") %}

- Service starts: 5PM
- Dinner provided after service.

{% end %}

</div>

</div>

<div class="bg-zinc-900 py-8">

{% title_with_highlight() %}

Be **transformed** by gospel-centred sermons

{% end %}

{{ sermon_series() }}
<div class="psuedo h-8"></div>
{{ livestream_button() }}

</div>

<div class="py-8">

{% title_with_highlight() %}

Be **equipped** to make disciples in community

{% end %}

<div class="text-xl md:px-20 px-8 font-bold">

Missional Communities (MCs) are small groups committed to being formed by Jesus in
community for the sake of others. We usually meet weekly in homes for a time of eating,
praying for each other, studying God’s word and on occasion serving the community.

</div>

{{ simple_image(
  image="build_only/images/mc.png",
  container_class="p-4 flex justify-center"
  image_class="max-h-[30vh] rounded-md"
)}}

<div class="flex justify-center gap-2 md:px-4 px-2">

{{ get_connected_button() }}

{{ mc_locations_button() }}

</div>

</div>

<div class="bg-zinc-800 py-8">

{% title_with_highlight() %}

Get in **touch**

{% end %}

<div class="text-xl md:px-20 px-8 font-bold pb-4">

We are a church community in Clayton,
across the street from Monash University Clayton campus.

</div>

{{ regen_map() }}

</div>
