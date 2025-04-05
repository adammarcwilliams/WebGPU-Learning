// Entry point of the application
export async function main() {
  // Request a GPU adapter from the browser
  const adapter: GPUAdapter | null = await navigator.gpu?.requestAdapter();

  // Check if the adapter is available
  if (!adapter) {
    console.error("Failed to get GPU adapter");
    return;
  }

  // Request a GPU device from the adapter
  const device: GPUDevice | null = await adapter.requestDevice();

  // Check if the device is available
  if (!device) {
    console.error("Need a browser that supports WebGPU");
    return;
  }

  // Get the canvas element from the DOM
  const canvas = document.getElementById("myCanvas") as HTMLCanvasElement | null;
  if (!canvas) {
    console.error("Canvas element with id 'myCanvas' not found");
    return;
  }

  // Get the WebGPU rendering context from the canvas
  const context: GPUCanvasContext | null = canvas.getContext("webgpu");
  if (!context) {
    console.error("Failed to get WebGPU context");
    return;
  }

  // Get the preferred texture format for the canvas
  const presentationFormat: GPUTextureFormat = navigator.gpu.getPreferredCanvasFormat();

  // Configure the canvas context with the GPU device and texture format
  context.configure({
    device,
    format: presentationFormat,
  });

  // Create a shader module with vertex and fragment shaders
  const module = device.createShaderModule({
    label: "Our Hardcoded Red Triangle Shaders",
    code: `
      @vertex
      fn vs(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
        var positions = array<vec2<f32>, 3>(
          vec2<f32>(0.0, 0.5),
          vec2<f32>(-0.5, -0.5),
          vec2<f32>(0.5, -0.5)
        );
        let position = positions[vertexIndex];
        return vec4<f32>(position, 0.0, 1.0);
      }

      @fragment
      fn fs() -> @location(0) vec4<f32> {
        return vec4<f32>(1.0, 0.0, 0.0, 1.0); // Red color
      }
    `,
  });

  // Create a render pipeline with a hardcoded red triangle
  const pipeline = device.createRenderPipeline({
    label: "Our Hardcoded Red Triangle Pipeline",
    layout: "auto",
    vertex: {
      module,
      entryPoint: "vs", // Vertex shader entry point
    },
    fragment: {
      module,
      entryPoint: "fs", // Fragment shader entry point
      targets: [
        {
          format: presentationFormat,
        },
      ],
    },
    primitive: {
      topology: "triangle-list", // Define the type of primitive to render
    },
  });

  // Create a render pass descriptor for the canvas
  const renderPassDescriptor: GPURenderPassDescriptor = {
    label: "Our Basic Canvas RenderPass",
    colorAttachments: [
      {
        view: context.getCurrentTexture().createView(),
        clearValue: { r: 0.3, g: 0.3, b: 0.3, a: 1.0 }, // Grey background
        loadOp: "clear", // Clear the canvas before rendering
        storeOp: "store", // Store the rendered content
      },
    ],
  };

  function render() {
    if (!device) {
      console.error("GPU device is not available");
      return;
    }

    // Create a command encoder to start encoding commands
    const encoder = device.createCommandEncoder({
      label: "Our Encoder",
    });

    // Begin a render pass
    const pass = encoder.beginRenderPass(renderPassDescriptor);

    // Set the pipeline and draw the triangle
    pass.setPipeline(pipeline);
    pass.draw(3); // Call out the vertex shader 3 times to draw the triangle
    pass.end(); // End the render pass

    // Submit the commands to the GPU queue
    device.queue.submit([encoder.finish()]);
  }

  // Start the rendering loop
  render();
}
