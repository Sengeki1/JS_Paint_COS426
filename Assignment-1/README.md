  ### Constrast

To apply contrast filter its really simple. ```contrastFilter(image, ratio)``` changes the contrast of an image by interpolating between a constant gray image ```(ratio = -1)``` with the average luminance and the original image ```(ratio = 0)```. Interpolation reduces contrast, extrapolation boosts contrast, and negative factors generate inverted images.

Noting that ratio is in the domain ```[-1, 1]``` we only have to change the color channels by ajusting the contrast which we use this formula as reference.

```js
  if (ratio < 0.0)  {
      ajustedValue = value * ( 1.0 + ratio)
  } else {
      ajustedValue = value + ((1 - value) * ratio)
  }
  ajustedValue = (ajustedValue - 0.5) * Math.tan((ratio + 1) * Math.PI/4) + 0.5
```

### Vignette

The vignetting effect typically involves smoothly darkening the pixels of an image towards the edges, while maintaining clarity in the center. The inner and outer radii define the boundaries within which this effect occurs.

For each pixel in the image, calculate its distance from the center of the image. This distance can be computed using the Euclidean distance formula.

$$r = \sqrt{(x - x_c)^2 + (y - y_c)^2}$$

Where $(x_c, y_c)$ are the coordinates of the center of the image. 

Using a Quadratic function we can smoothly transitions from 1 (no effect) at the center to 0 (fully darkened) at the outer radius. 

$$f(r) = 1 - (\frac{r - innerR}{outerR - innerR})^2$$

This function smoothly decreases from ```1``` to ```0``` as ```r``` increases from the inner radius to the outer radius.
We then normalize it to ensure that points are applied properly within the circular region

### Histogram Equalization

<img src="https://github.com/Sengeki1/JS_Paint_COS426/assets/106749775/bd0ff0f2-7c8b-4d5c-b476-d5a17dc0d0f1" alt="Logo">

Here, ```δ``` is the Kronecker delta function, which is ```1``` if $I(x, y) = k$ and ```0``` otherwise. This formula computes the histogram H(k) by counting the frequency of each intensity level k in the image.

* $H(k)$ represents the histogram value for intensity level $k$
* $N$ and $M$ are the dimensions of the image.
* $I(x, y)$ represents the intensity value of the image at position $(x, y)$
* $δ(I(x, y) - k)$ is the Kronecker delta function, which equals 1 if $I(x, y)$ = k and 0 otherwise.

First we iterate over the pixels then we retrive the intensity value $I(x, y)$ or Lightness of the Image of pixel at coordinate $(x, y)$
The line ```histogram[lightness]++```; increments the count in the histogram array for the specific lightness value encountered at a pixel. Let me clarify why we're using this line:

In the histogram array, each index represents a particular lightness value, ranging from ```0``` to ```100```. For example, ```histogram[0]``` represents the count of pixels with a lightness value of ```0```, ```histogram[1]``` represents the count of pixels with a lightness value of ```1```, and so on, up to ```histogram[100]``` for a lightness value of ```100```.

When we encounter a pixel with a particular lightness value, we increment the count in the histogram array at the index corresponding to that lightness value. For example, if we encounter a pixel with a ```lightness value of 50```, we increment ```histogram[50]``` by ```1``` to indicate that we've found ```another pixel with a lightness value of 50```.

After computing the histogram, the next step in histogram equalization is to compute the ```Cumulative Distribution Function (CDF)``` based on the histogram. The CDF represents the cumulative probability distribution of the lightness values in the image.

First, we compute the histogram $H(k)$, which counts the frequency of each intensity level $k$ in the image. Diferent from grayscale which its levels range from ```[0, 255]```, hsl range from ```0%``` to ```100%```.For example, let's say our histogram is:
* $H (0) = 10$
* $H (1) = 20$
* $H (2) = 15$
* ...
* $H (100) = 5$
  
Next, we normalize the histogram so that its values represent probabilities. We divide each histogram bin count by the total number of pixels in the image $Npixels$. Suppose our image has $Npixels = 1000$ pixels. The normalized histogram would be:
* $Normalized Histogram (0) = 10/1000 = 0.01$
* $Normalized Histogram (1) = 20/1000 = 0.02$
* $Normalized Histogram (2) = 15/1000 = 0.015$
* ...
* $Normalized Histogram (100) = 5/1000 = 0.005$

Finally, we compute the cumulative sum of the normalized histogram values up to each intensity level $k$. This gives us the cumulative distribution function.
* $CDF (0) = Normalized Histogram(0) = 0.01$
* $CDF (1) = Normalized Histogram (0) + Normalized Histogram (1) = 0.01 + 0.02 = 0.03$
* $CDF (2) = Normalized Histogram (0) + Normalized Histogram (1) + Normalized Histogram (2) = 0.01 + 0.02 + 0.0015 = 0.045$
* ...
* $CDF (100) = 1$

Lastly we map the original intensity values of the image to their corresponding values in the CDF. This mapping redistributes the intensity values to achieve a more uniform distribution. 
Let $f(x)$ be the histogram equalization function that maps the original intensity value $x$ to their corresponding values in the CDF $CDF(x)$. This function can be fefine as:

$$f(x) = round(\frac{CDF(x) - min(CDF)}{max(CDF)-min(CDF)} * (L - 1))$$

Once the histogram equalization function is defined, you can update each pixel's intensity value in the image using this function

### Saturation

Firstly we iterate over the image and get the original pixels of that image so that we can perform the grayscale filter. We interpolate it with the saturation of the original image. 
Next we perform the interpolation by using the formula from the provided reference which is:

Alpha being ```alpha = ratio + 1```

$$(1 - alpha) * Sgrayscale + alpha * Soriginal$$

### White Balance

The first step in the Von Kries method is to convert the image from the RGB color space to the LMS color space. This conversion involves matrix multiplication with a transformation matrix. 

After converting to the LMS color space, you need to divide each pixel's LMS values by the LMS coordinates of the white point. Finally, the adjusted LMS values need to be converted back to the RGB color space to get the final white-balanced image.

Reference: <https://medium.com/@KuldeepDileep/chromatic-adaptation-with-matlab-code-9af2aaf9096a>

### Edges

To implement an edge detection filter using convolution first we set its kernel then we normalize it so that it doesn't change the overall brightness of the image. Then we invert each pixel in the image so that the image is clearer for visualization once we determine it's edges. 

$$pixel = 1 - pixel$$

Then we set the image as grayscaled so that we can find areas in the image where the intensity is higher which will allow us to work better with the image in calculating its edges.

Before convolving the image with the kernel, we create a new image and set only the edge pixels to white, which will allow us to work better with the image in calculating edges.

### Bilateral

A bilateral filter is a non-linear, edge-preserving, and noise-reducing smoothing filter for images. It replaces the intensity of each pixel with a weighted average of intensity values from nearby pixels. This weight can be based on a Gaussian distribution.

For the pixel $I(i,j)$ located at $(i,j)$, the bilateral filter weight of pixel $I(k,l)$, $I$ being the intensity value of the pixel, is given by:

$$w(i,j,k,l) = exp(- \frac{(i - k)^2 + (j - l)^2}{2σ_d^2} - \frac{||I(i,j) - I(k,l)||^2}{2σ_r^2})$$

After calculating the weights, normalize them: 

$$I_D(i,j) = \frac{Σ_{k, l} I(k,l)w(i,j,k,l)}{Σ_{k, l}w(i,j,k,l)}$$

where $I_D$ is the denoised intensity of pixel $(i, j)$

### Error diffusion Dither

The algorithm achieves dithering using error diffusion, meaning it pushes (adds) the residual quantization error of a pixel onto its neighboring pixels, to be dealt with later. It spreads the debt out according to the distribution.

#### Pseudocode

```jai
for each y from top to bottom do
    for each x from left to right do
        oldpixel := pixels[x][y]
        newpixel := find_closest_palette_color(oldpixel)
        pixels[x][y] := newpixel
        quant_error := oldpixel - newpixel
        pixels[x + 1][y    ] := pixels[x + 1][y    ] + quant_error × 7 / 16
        pixels[x - 1][y + 1] := pixels[x - 1][y + 1] + quant_error × 3 / 16
        pixels[x    ][y + 1] := pixels[x    ][y + 1] + quant_error × 5 / 16
        pixels[x + 1][y + 1] := pixels[x + 1][y + 1] + quant_error × 1 / 16
```

```jai
  find_closest_palette_color(oldpixel) = round(oldpixel / 255)
```

For more information: <https://en.wikipedia.org/wiki/Floyd%E2%80%93Steinberg_dithering>

### Ordered Dithering

The algorithm reduces the number of colors by applying a threshold map ```M``` to the pixels displayed, causing some pixels to change color, depending on the distance of the original color from the available color entries in the reduced palette.

A more simpler way to analize it, is that we compare the intensity of a given pixel with a standard threshold matrix. If the intensity value is higher then the threshold set it as white and if not black.

For more information: 
<https://en.wikipedia.org/wiki/Ordered_dithering>
<https://www.youtube.com/watch?v=IviNO7iICTM&t=1s>

## Transformations

### Translate

The most simple geometric transform is the translation along one of the image axis or all at once. An image, or the ensemble of pixels that are translated in the coordinate system, undergo the equations:

$$x' = x + x_T$$ 

$$y' = y + y_T$$

Where $x'$ and $y'$ are the coordinates of a pixel $P$ in the new image and $x$ and $y$ the coordinates of the original. The distance of which $P$ is translated in every direction is denoted by $x_T$ and $y_T$

![image](https://github.com/Sengeki1/JS_Paint_COS426/assets/106749775/da6b908e-92f2-4f5f-9894-d8fbea6f741b)

### Scale

To scale an image we simply multiply the current position of a given pixel by a scalar. 

```js
  let xscalar = (x - x_c) * ratio + x_c
  let yscalar = (y - y_c) * ratio + y_c
```

* ```x``` and ```y``` represent the original pixel coordinates
* ```x_c``` and ```y_c``` represent the center of the image.
* ```ratio``` is the scaling ratio

By applying these equations to each pixel in the image, you're scaling it around the center point $(x_c, y_c)$. This method preserves the center of the image while scaling it.

### Rotate

To apply rotation we use a rotation matrix which is given by:

```js
 R = [[cos(theta), -sin(theta)],
      [sin(theta),  cos(theta]]
```

The formula would be this:

$$x' = x * cos(θ) - y * sin(θ)$$ 

$$y' = x * sin(θ) + y * cos(θ)$$

### Swirl

Following the same logic as a rotation transformation, instead of rotating the image we want it to shifts individual pixels based on their distance from the center of the image.

We first calculates the distance between the current pixel and the center of the image using the Euclidean distance formula. Calculating the Euclidean distance serves two main purposes in this context: 

* Determining Distance from Center
* Controlling Intensity of Swirl

his distance is used as a measure of how far away the pixel is from the center and it determines how much each pixel should be shifted or "swirled". Pixels closer to the center will be shifted less, while pixels farther from the center will be shifted more. By using the Euclidean distance, the function can create a gradual swirling effect, with pixels near the center experiencing minimal shifting and pixels further away experiencing greater shifting.

Lastly, one important step is to calculates the angle of rotation for the current pixel based on the distance from the center. This determines how much the pixel should be rotated.

## Sampling

### Point

When you need to determine the color of a pixel at a specific coordinate in an image, point sampling simply selects the color value of the nearest pixel to that coordinate. 
The coordinates ```x``` and ```y``` are first rounded to the nearest integers using ```Math.round(x)``` and ```Math.round(y)```.

### Gaussian

Gaussian sampling in image processing involves using the Gaussian distribution to calculate the weights of neighboring pixels when applying a Gaussian filter to an image. This weighted averaging process smooths out the image while preserving important details.

For each pixel in the image, we place the Gaussian kernel centered at that pixel.
We then compute the weighted sum of the pixel values in the kernel's neighborhood, with weights determined by the Gaussian distribution.
The result of this weighted sum becomes the new value for the pixel.

### Bilinear

In bilinear interpolation, we're essentially estimating the pixel value at a position within a grid by considering the pixel values at the four nearest corners of that grid. The interpolation coefficients ```𝛼``` and ```𝛽``` determine how much influence each corner pixel has on the interpolated value, based on the relative positions of the target point within the grid.

Let's consider a grid with coordinates $(x_0, y_0)$, $(x_1, y_0)$, $(x_0, y_1)$ and $(x_1, y_1)$, where $(x_0, y_0)$ represents the top-left corner, $(x_1, y_0)$ represents the top-right corner, $(x_0, y_1)$ represents the bottom-left corner and $(x_1, y_1)$ represents the bottom-right corner.

The interpolation coefficients ```α``` and ```β``` are calculated as follows:

$$α = \frac{x - x_0}{x_1 - x_0}$$

$$β = \frac{y - y_0}{y_1 - y_0}$$

The interpolated pixel value $v(x ,y)$ is computed using the formula:

$$v(x, y) = ((1 - α) * (1 - β) * V00) + (α * (1 - β) * V10) + ((1 - α) * β * V01) + (α * β * V11)$$


## Composition

One common method to compose a foreground image over a background image is alpha compositing. In alpha compositing, each pixel of the foreground image is blended with the corresponding pixel of the background image using an alpha value, which represents the transparency of the foreground image.

Let's denote the alpha value of the foreground image as $α(x, y)$, which ranges between 0 (fully transparent) and 1 (fully opaque). The composite image $O(x, y)$ is computed as:

$$O(x, y) = (1 - α(x, y)) * B(x, y) + α(x, y) * F(x, y)$$

This formula represents a weighted sum of the background and foreground pixels at each location, where the weights are determined by the alpha values. If $α(x, y) = 0$, the pixel from the background image is fully visible, and if $α(x, y) = 1$, the pixel from the foreground image is fully visible.

This formula essentially blends the foreground and background images based on the transparency of the foreground image at each pixel location.

To work with this filter first you gotta set 3 essential images:
* Background Image
* Foreground Image
* Foreground Image alpha

First we setup the alpha channel of the background image with the ```getAlphaFilter```. This filter sets the alpha channel of the background image based on the luminance of the corresponding pixel in the foreground image. It calculates the luminance using the formula:

$$Luminance = 0.2126 × R + 0.7152 × G + 0.0722 × B$$

Then, it assigns this luminance value to the alpha channel of the background pixel. This essentially converts the luminance of the foreground image to alpha values for the background image. 

If we dont do this the alpha value is consistently set to ```1``` and doesn't change for each pixel in the foreground image, then it implies that the foreground image is fully opaque, and there will be no transparency or blending effect with the background image.
