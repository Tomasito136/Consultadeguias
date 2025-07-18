import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { type, guideNumber, email, message, tcaData } = await request.json()

    if (type === "email") {
      // Crear el contenido HTML del email con la información de la guía
      const emailHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Guía TCA Arribada</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; border: 1px solid #e5e7eb; }
            .guide-info { background-color: #f3f4f6; padding: 15px; margin: 10px 0; }
            .success-badge { background-color: #10b981; color: white; padding: 5px 10px; border-radius: 5px; }
            .tca-image { max-width: 100%; height: auto; margin: 20px 0; border: 2px solid #10b981; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🛬 Guía TCA Arribada</h1>
          </div>
          <div class="content">
            <h2>La guía <span class="success-badge">${guideNumber}</span> ha arribado exitosamente</h2>
            
            ${
              tcaData
                ? `
            <div class="guide-info">
              <h3>Información de la Guía:</h3>
              <p><strong>Operación:</strong> ${tcaData.operacion}</p>
              <p><strong>Documento de Ingreso:</strong> ${tcaData.docIngreso}</p>
              <p><strong>Estado:</strong> ${tcaData.estado}</p>
              <p><strong>Vuelo:</strong> ${tcaData.numeroTransporte}</p>
              <p><strong>Fecha:</strong> ${tcaData.fechaTransporte}</p>
              <p><strong>Aerolínea:</strong> ${tcaData.responsableTransporte}</p>
              <p><strong>Bultos:</strong> ${tcaData.bultos}</p>
              <p><strong>Kilos:</strong> ${tcaData.kilos}</p>
            </div>
            `
                : ""
            }
            
            <p>La guía está lista para ser procesada. Puedes consultar los detalles completos en el portal TCA.</p>
            
            <img src="/tca-success-template.png" alt="Confirmación TCA" class="tca-image" />
            
            <p><small>Este es un mensaje automático del sistema de monitoreo de guías TCA.</small></p>
          </div>
        </body>
        </html>
      `

      console.log(`[Email] Enviando email a: ${email}`)
      console.log(`[Email] Asunto: Guía ${guideNumber} ha arribado - TCA`)
      // console.log(`[Email] Contenido HTML: ${emailHTML}`); // Descomentar para ver el HTML completo

      // Aquí es donde integrarías tu servicio de envío de emails real (ej. SendGrid)
      // Necesitarías instalar el SDK de SendGrid: `npm install @sendgrid/mail`
      // Y configurar tu API Key como variable de entorno (SENDGRID_API_KEY)

      /*
      import sgMail from '@sendgrid/mail';
      sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

      const msg = {
        to: email,
        from: 'tu_email_verificado@tudominio.com', // Reemplaza con tu email verificado en SendGrid
        subject: `Guía ${guideNumber} ha arribado - TCA`,
        html: emailHTML,
      };

      try {
        await sgMail.send(msg);
        console.log(`[Email] Email para ${guideNumber} enviado con éxito.`);
      } catch (sgError: any) {
        console.error(`[Email] Error al enviar email para ${guideNumber}:`, sgError.response?.body || sgError);
        // Puedes decidir si quieres lanzar el error o simplemente loggearlo
      }
      */

      // Simular envío exitoso para el preview
      await new Promise((resolve) => setTimeout(resolve, 1000))

      return NextResponse.json({
        success: true,
        message: "Email simulado enviado correctamente con información de la guía",
      })
    }

    return NextResponse.json({
      success: false,
      message: "Tipo de notificación no soportado",
    })
  } catch (error) {
    console.error("Error enviando notificación:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}
