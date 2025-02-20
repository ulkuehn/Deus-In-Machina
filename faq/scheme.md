## Object Schemes and Properties

### What's behind schemes and properties?

Properties allow you to add content to objects. While it may be sufficient to have an object just with a name in certain cases, you may want to add more detail in others.

Schemes define what properties an object has. The content is in the properties themselves. While it may seem overengineered to have this scheme/property split it helps when you have more than one object of a kind.

Consider three or more characters you want to keep track of in your story. They all share the properties of name, height, weight, eye color, character description, birthday, and so on. Instead of adding these properties repeatedly to several objects, create one parent object (maybe called "character"), define its scheme to include all necessary properties, which will then be available in all objects placed one (or any) level down the tree hierarchy.

### Why can I edit some scheme entries but not others?

Object Schemes are inherited from parent objects, that's why. The scheme defined in a parent (or grandparent) object is part of the object's scheme and cannot be changed. The idea is that you use the hierarchy of objects to have more detail the further down an object is in the tree levels.

You could for example create an object "Building" with properties "Color", "Year of construction" and "Design". As its children consider one object "The Muzak Concert Hall" with additional property "Seats" and another object "Schlong Tower" with additional properties "Stories" and "Rooftop Terrace?". Of course both, highrises and concert halls have a year of construction, but seats are only relevant for one of them.

### What property types are there?

Overall, there are 13 types of properties you can choose from in the scheme tab:

- Header

  Headers are just for organizing properties into groups. You can give them a name -- and that's it.

- Relation

  Using a relation you can connect the object with any other object. Describe the meaning of the relation in its name, e.g. "mother of" or "living in". You can specify a reverse relation (e.g. "son of" or "inhabitant of") which can be seen in the related object's overwiew tab and in a project's export.

- Checkbox

  With a checkbox you can provide a two valued property that can be set on or off. An example would be a property called "alive".

- Slider

  Sliders add a numerical range to an object. You specify a minimum and a maximum value as well as a step distance. The unit spec adds context. For example, use a slider for a person's age ranging from 0 to 125 (should suffice for all humans) with step 1 and unit "years".

- Select dropdown

  Provides a dropdown box where you can pick one value out of many. The values you can choose from are defined by a string seperated by "#" characters. You could define a property called "vehicle" using the string "bicycle#car#supersonic golfcart".

- Radio

  Much like a select, but all values are visible.

- Color

  A color box adds color information to an object.

- Text line

  You can type a short unformatted text into a text line, such as a person's name.

- Text editor

  In a text editor you can enter fully formatted longer texts, including images. Use the editor directly in the properties tab or open a detached window if you need more screen space.

- Calender date

  Adds a control to the properties where you can pick a single date. Provide a year range you can choose out of if you need more or less than the one hundred years in the past and in the future of today.

- Calender range

  You can set a date range with this control.

- Geographical map

  The map scheme type allows you to add geographical information of some place on earth to your object. You can zoom to the area of your interest and add locations as needed. Internet access is needed for the maps to display.

  Add locations to the map by right clicking on it. Give them a description and a color and move them around on the map as needed. To delete a location right click on it.

- File

  With the file control you can add arbitrary files to your object. When you pick a file from one of your system folders a copy will become part of your project. Its content is available in the object no matter if the original file is still on your sytem or if it was taken from some other computer where the project was edited earlier.

  A file is opened with the system's native application for the respective file type (say, a video player).

  Please be aware that files can blow up the size of your project files considerably, so use them with care.

**Attention**: when you change an item's type in the scheme tab the content of the respective property will be deleted. If you change the type by accident and don't want to lose the original content, abort editing the object. As long as you do not save the object nothing is lost.

### Can I define property types of my own?

No, the list is not user extensible. But you can use as many of the provided types in an object as you wish.
